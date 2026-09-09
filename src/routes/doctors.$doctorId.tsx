import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, GraduationCap, Languages, Lock, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/site-chrome";
import {
  bookableDays,
  formatDay,
  formatTime,
  photoFor,
  slotsFor,
  type Doctor,
} from "@/lib/mediconnect";

export const Route = createFileRoute("/doctors/$doctorId")({
  head: () => ({
    meta: [
      { title: "Doctor profile — MediConnect" },
      {
        name: "description",
        content:
          "Read the doctor's biography, qualifications and patient reviews, then pick an available video appointment slot.",
      },
      { property: "og:title", content: "Doctor profile — MediConnect" },
      {
        property: "og:description",
        content: "Biography, qualifications, patient reviews and live appointment availability.",
      },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { doctorId } = Route.useParams();
  const [dayIndex, setDayIndex] = useState(0);
  const days = bookableDays();
  const day = days[dayIndex] ?? days[0]!;

  const { data, isLoading } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: async () => {
      const [doctor, reviews] = await Promise.all([
        supabase.from("doctors").select("*").eq("id", doctorId).maybeSingle(),
        supabase
          .from("reviews")
          .select("*")
          .eq("doctor_id", doctorId)
          .order("created_at", { ascending: false }),
      ]);
      if (doctor.error) throw doctor.error;
      return {
        doctor: doctor.data as unknown as Doctor | null,
        reviews: (reviews.data ?? []) as { id: string; author: string; rating: number; comment: string }[],
      };
    },
  });

  if (isLoading) {
    return (
      <Page>
        <p className="mx-auto max-w-6xl px-5 py-20 text-muted-foreground">Loading profile…</p>
      </Page>
    );
  }

  const d = data?.doctor;
  if (!d) {
    return (
      <Page>
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h1 className="text-2xl font-bold">Doctor not found</h1>
          <Link to="/doctors" className="btn-primary mt-6">
            Back to directory
          </Link>
        </div>
      </Page>
    );
  }

  const slots = slotsFor(d.id, day);

  return (
    <Page>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <Link to="/doctors" className="text-sm font-semibold text-primary hover:underline">
          ← All doctors
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="card-soft flex flex-col gap-6 p-7 sm:flex-row">
              <img
                src={photoFor(d.photo_key)}
                alt={d.name}
                width={512}
                height={512}
                className="h-32 w-32 rounded-3xl object-cover"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-extrabold">{d.name}</h1>
                  {d.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2.5 py-1 text-xs font-bold text-primary">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified clinician
                    </span>
                  )}
                </div>
                <p className="mt-1 font-semibold text-muted-foreground">{d.specialty}</p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <span className="flex items-center gap-1 font-semibold">
                    <Star className="h-4 w-4 fill-mint text-mint" /> {d.rating}
                    <span className="font-normal text-muted-foreground">
                      ({d.reviews_count} reviews)
                    </span>
                  </span>
                  <span className="text-muted-foreground">{d.years_experience} yrs experience</span>
                  <span className="font-semibold">${d.fee} per consultation</span>
                </div>
              </div>
            </div>

            <div className="card-soft p-7">
              <h2 className="text-xl font-bold">About</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{d.bio}</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <GraduationCap className="h-4 w-4 text-primary" /> Qualifications
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {d.qualifications.map((q) => (
                      <li key={q}>· {q}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <Languages className="h-4 w-4 text-primary" /> Languages
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{d.languages.join(", ")}</p>
                </div>
              </div>
            </div>

            <div className="card-soft p-7">
              <h2 className="text-xl font-bold">Patient reviews</h2>
              <div className="mt-5 space-y-5">
                {(data?.reviews ?? []).map((r) => (
                  <div key={r.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.author}</span>
                      <span className="flex">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-mint text-mint" />
                        ))}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="card-soft h-fit p-7 lg:sticky lg:top-24">
            <h2 className="text-xl font-bold">Available slots</h2>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {days.slice(0, 7).map((dd, i) => (
                <button
                  key={dd.toISOString()}
                  onClick={() => setDayIndex(i)}
                  className={`shrink-0 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                    i === dayIndex
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  {formatDay(dd)}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {slots.map((s) => (
                <Link
                  key={s.toISOString()}
                  to="/book/$doctorId"
                  params={{ doctorId: d.id }}
                  search={{ slot: s.toISOString() }}
                  className="rounded-xl border border-border bg-card py-2 text-center text-sm font-semibold transition hover:border-primary hover:bg-sky-soft"
                >
                  {formatTime(s)}
                </Link>
              ))}
              {slots.length === 0 && (
                <p className="col-span-3 text-sm text-muted-foreground">
                  No slots left on this day — try another date.
                </p>
              )}
            </div>
            <Link to="/book/$doctorId" params={{ doctorId: d.id }} className="btn-primary mt-6 w-full">
              Book a consultation
            </Link>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint" />
              Your details and messages are encrypted end to end and only shared with this
              clinician.
            </p>
          </aside>
        </div>
      </div>
    </Page>
  );
}
