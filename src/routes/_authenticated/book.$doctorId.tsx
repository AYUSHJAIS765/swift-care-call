import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarCheck, CheckCircle2, Lock, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/site-chrome";
import {
  bookableDays,
  formatDay,
  formatSlot,
  formatTime,
  photoFor,
  slotsFor,
  type Doctor,
} from "@/lib/mediconnect";

export const Route = createFileRoute("/_authenticated/book/$doctorId")({
  validateSearch: (search: Record<string, unknown>) => ({
    slot: typeof search['slot'] === "string" ? (search['slot'] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book your consultation — MediConnect" },
      {
        name: "description",
        content:
          "Choose a time, share a few details about your visit and confirm your secure video consultation.",
      },
      { property: "og:title", content: "Book your consultation — MediConnect" },
      { property: "og:description", content: "Pick a time and confirm your video consultation." },
    ],
  }),
  component: Booking,
});

function Booking() {
  const { doctorId } = Route.useParams();
  const { slot: presetSlot } = Route.useSearch();
  const navigate = useNavigate();
  const days = bookableDays();

  const [step, setStep] = useState(presetSlot ? 2 : 1);
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState<string | undefined>(presetSlot);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bookedId, setBookedId] = useState<string | null>(null);

  const { data: doctor } = useQuery({
    queryKey: ["doctor-basic", doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", doctorId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Doctor | null;
    },
  });

  async function confirm() {
    if (!slot) return;
    setBusy(true);
    setError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          doctor_id: doctorId,
          patient_id: userData.user!.id,
          patient_name: name,
          patient_age: age ? Number(age) : null,
          reason,
          scheduled_at: slot,
        })
        .select("id")
        .single();
      if (error) throw error;
      setBookedId(data.id);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm the booking.");
    } finally {
      setBusy(false);
    }
  }

  const day = days[dayIndex] ?? days[0]!;

  return (
    <Page>
      <div className="mx-auto max-w-3xl px-5 py-12">
        <ol className="flex items-center gap-3 text-sm font-semibold">
          {["Pick a time", "Your details", "Confirmed"].map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                  step > i ? "bg-mint text-mint-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className={step > i ? "" : "text-muted-foreground"}>{label}</span>
              {i < 2 && <span className="h-px w-6 bg-border" />}
            </li>
          ))}
        </ol>

        {doctor && (
          <div className="card-soft mt-7 flex items-center gap-4 p-5">
            <img
              src={photoFor(doctor.photo_key)}
              alt={doctor.name}
              loading="lazy"
              width={512}
              height={512}
              className="h-14 w-14 rounded-2xl object-cover"
            />
            <div>
              <p className="font-bold">{doctor.name}</p>
              <p className="text-sm text-muted-foreground">
                {doctor.specialty} · ${doctor.fee} per consultation
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="card-soft mt-5 p-7">
            <h1 className="text-2xl font-extrabold">Pick a time</h1>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {days.map((dd, i) => (
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
            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slotsFor(doctorId, day).map((s) => {
                const iso = s.toISOString();
                return (
                  <button
                    key={iso}
                    onClick={() => setSlot(iso)}
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                      slot === iso
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-sky-soft"
                    }`}
                  >
                    {formatTime(s)}
                  </button>
                );
              })}
            </div>
            <button
              className="btn-primary mt-7"
              disabled={!slot}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card-soft mt-5 p-7">
            <h1 className="text-2xl font-extrabold">Your details</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {slot ? formatSlot(slot) : "No time selected"} ·{" "}
              <button className="font-semibold text-primary hover:underline" onClick={() => setStep(1)}>
                change
              </button>
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-bold" htmlFor="pname">
                  Full name
                </label>
                <input
                  id="pname"
                  className="field mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-bold" htmlFor="page">
                  Age
                </label>
                <input
                  id="page"
                  type="number"
                  min={0}
                  max={120}
                  className="field mt-1.5"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-bold" htmlFor="reason">
                  Reason for visit
                </label>
                <textarea
                  id="reason"
                  rows={4}
                  className="field mt-1.5"
                  placeholder="Briefly describe your symptoms or what you'd like to discuss."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint" />
                Shared only with this clinician, stored encrypted.
              </p>
              <button
                className="btn-primary w-full"
                disabled={busy || !name || !slot}
                onClick={confirm}
              >
                {busy ? "Confirming…" : "Confirm booking"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card-soft mt-5 p-9 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mint-soft">
              <CheckCircle2 className="h-7 w-7 text-mint" />
            </span>
            <h1 className="mt-5 text-2xl font-extrabold">You're booked in</h1>
            <p className="mt-2 text-muted-foreground">
              We've emailed the details and you can join from your dashboard.
            </p>
            <dl className="mx-auto mt-7 max-w-sm space-y-3 text-left text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">Doctor</dt>
                <dd className="font-semibold">{doctor?.name}</dd>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">When</dt>
                <dd className="font-semibold">{slot ? formatSlot(slot) : ""}</dd>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">Patient</dt>
                <dd className="font-semibold">
                  {name}
                  {age ? `, ${age}` : ""}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Fee</dt>
                <dd className="font-semibold">${doctor?.fee}</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/dashboard" className="btn-primary">
                <CalendarCheck className="h-4 w-4" /> Go to dashboard
              </Link>
              {bookedId && (
                <button
                  className="btn-ghost"
                  onClick={() =>
                    navigate({ to: "/consult/$appointmentId", params: { appointmentId: bookedId } })
                  }
                >
                  <Video className="h-4 w-4" /> Preview the call room
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
