CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'patient',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  specialty text NOT NULL,
  bio text NOT NULL DEFAULT '',
  qualifications text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  photo_key text NOT NULL DEFAULT 'doc-1',
  rating numeric(2,1) NOT NULL DEFAULT 5.0,
  reviews_count int NOT NULL DEFAULT 0,
  years_experience int NOT NULL DEFAULT 1,
  fee int NOT NULL DEFAULT 50,
  verified boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.doctors TO anon;
GRANT SELECT, UPDATE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctors public read" ON public.doctors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "doctor updates own listing" ON public.doctors FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  author text NOT NULL,
  rating int NOT NULL DEFAULT 5,
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.owns_doctor(_doctor_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = _doctor_id AND d.user_id = auth.uid());
$$;

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  patient_name text NOT NULL,
  patient_age int,
  reason text NOT NULL DEFAULT '',
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  doctor_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX appointments_doctor_time_idx ON public.appointments (doctor_id, scheduled_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patient reads own appointments" ON public.appointments FOR SELECT TO authenticated USING (patient_id = auth.uid() OR public.owns_doctor(doctor_id));
CREATE POLICY "patient books appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (patient_id = auth.uid());
CREATE POLICY "patient or doctor updates appointment" ON public.appointments FOR UPDATE TO authenticated USING (patient_id = auth.uid() OR public.owns_doctor(doctor_id)) WITH CHECK (patient_id = auth.uid() OR public.owns_doctor(doctor_id));
CREATE POLICY "patient cancels appointment" ON public.appointments FOR DELETE TO authenticated USING (patient_id = auth.uid());

CREATE OR REPLACE FUNCTION public.claim_doctor_profile()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  claimed uuid;
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  IF user_email IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO claimed FROM public.doctors WHERE user_id = auth.uid();
  IF claimed IS NOT NULL THEN RETURN claimed; END IF;
  UPDATE public.doctors SET user_id = auth.uid()
   WHERE lower(email) = lower(user_email) AND user_id IS NULL
   RETURNING id INTO claimed;
  RETURN claimed;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_doctor_profile() TO authenticated;

INSERT INTO public.doctors (id, email, name, specialty, bio, qualifications, languages, photo_key, rating, reviews_count, years_experience, fee) VALUES
('11111111-1111-4111-8111-111111111111','sarah.chen@mediconnect.health','Dr. Sarah Chen','Cardiology','Sarah is a board-certified cardiologist focused on preventive heart care, blood pressure management and post-op follow up. She believes most heart conditions are best managed through small, consistent changes.','{"MD, Johns Hopkins","Board Certified — Cardiovascular Disease","Fellow, American College of Cardiology"}','{English,Mandarin}','doc-1',4.9,128,14,120),
('22222222-2222-4222-8222-222222222222','marco.silva@mediconnect.health','Dr. Marco Silva','Dermatology','Marco treats acne, eczema, rosacea and skin cancer screening. He is a strong advocate of teledermatology for fast triage of new or changing skin lesions.','{"MD, University of São Paulo","Board Certified — Dermatology"}','{English,Portuguese,Spanish}','doc-2',4.7,86,9,90),
('33333333-3333-4333-8333-333333333333','amara.patel@mediconnect.health','Dr. Amara Patel','Pediatrics','Amara has cared for children from newborn to adolescence for over a decade. She offers calm, practical guidance for worried parents — from fevers to sleep and feeding.','{"MD, University of Michigan","Board Certified — Pediatrics"}','{English,Hindi,Gujarati}','doc-3',5.0,203,11,75),
('44444444-4444-4444-8444-444444444444','henry.novak@mediconnect.health','Dr. Henry Novak','General Practice','Henry is a family physician handling everyday concerns: infections, chronic condition reviews, prescriptions and referrals. Same-day slots most weekdays.','{"MD, University of Vienna","Diplomate, Family Medicine"}','{English,German}','doc-4',4.8,341,27,45),
('55555555-5555-4555-8555-555555555555','leila.haddad@mediconnect.health','Dr. Leila Haddad','Psychiatry','Leila works with adults living with anxiety, depression and burnout, combining medication review with practical therapeutic strategies in a judgement-free space.','{"MD, McGill University","Board Certified — Psychiatry","CBT Certification"}','{English,French,Arabic}','doc-5',4.9,157,12,140),
('66666666-6666-4666-8666-666666666666','david.okafor@mediconnect.health','Dr. David Okafor','Orthopedics','David specialises in sports injuries, joint pain and rehabilitation planning. Video consults are ideal for reviewing scans and deciding whether surgery is needed.','{"MD, University of Lagos","Fellowship — Sports Medicine"}','{English,Yoruba}','doc-6',4.6,64,8,110);

INSERT INTO public.reviews (doctor_id, author, rating, comment) VALUES
('11111111-1111-4111-8111-111111111111','Priya R.',5,'Explained my ECG results in plain English and never rushed me.'),
('11111111-1111-4111-8111-111111111111','Tom B.',5,'Adjusted my medication and followed up a week later unprompted.'),
('11111111-1111-4111-8111-111111111111','Elena M.',4,'Great consult, call started a few minutes late.'),
('22222222-2222-4222-8222-222222222222','Jonas K.',5,'Sent a photo of a mole, had a clear answer and referral same day.'),
('22222222-2222-4222-8222-222222222222','Ruth A.',4,'My eczema plan is finally working after years of guessing.'),
('33333333-3333-4333-8333-333333333333','Sam & Dee',5,'Wonderful with our toddler — reassuring and very practical.'),
('33333333-3333-4333-8333-333333333333','Nadia F.',5,'Talked us through a night-time fever calmly at 9pm. Lifesaver.'),
('44444444-4444-4444-8444-444444444444','George P.',5,'Straightforward, kind and quick with the prescription.'),
('44444444-4444-4444-8444-444444444444','Mira S.',4,'Good annual review, would book again.'),
('55555555-5555-4555-8555-555555555555','Anonymous',5,'The first appointment where I felt genuinely listened to.'),
('55555555-5555-4555-8555-555555555555','Chris D.',5,'Practical strategies, not just prescriptions.'),
('66666666-6666-4666-8666-666666666666','Aaron T.',5,'Reviewed my MRI and saved me an unnecessary surgery.'),
('66666666-6666-4666-8666-666666666666','Bea L.',4,'Clear rehab plan for my knee.');