import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock, History, ShieldCheck, Video, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/site-chrome";
import {
  bookableDays,
  formatDay,
  formatSlot,
  formatTime,
  photoFor,
  slotsFor,
  type Appointment,
  type Doctor,
} from "@/lib/mediconnect";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My appointments — MediConnect" },
      {
        name: "description",
        content:
          "See upcoming video consultations, reschedule or cancel, and review your past consultation history.",
      },
      { property: "og:title", content: "My appointments — MediConnect" },
      { property: "og:description", content: "Upcoming and past MediConnect consultations." },
    ],
  }),
  component: Dashboard,
});

type Row = Appointment & { doctors: Doctor };

function Dashboard() {
  const qc = useQueryClient();
  const [rescheduling, setRescheduling] = useState<Row | null>(null);
  const [dayIndex, setDayIndex] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["my-appointments"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("appointments")
        .select("*, doctors(*)")
        .eq("patient_id", userData.user!.id)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-appointments"] }),
  });

  const reschedule = useMutation({
    mutationFn: async ({ id, iso }: { id: string; iso: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ scheduled_at: iso, status: "upcoming" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setRescheduling(null);
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
    },
  });

  const now = Date.now();
  const rows = data ?? [];
  const upcoming = rows.filter(
    (a) => a.status === "upcoming" && new Date(a.scheduled_at).getTime() > now - 60 * 60 * 1000,
  );
  const past = rows.filter((a) => !upcoming.includes(a));

  return (
    <Page>
      <div className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="text-4xl font-extrabold">My appointments</h1>
        <p className="mt-2 text-muted-foreground">
          Join, reschedule or cancel your video consultations.
        </p>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <CalendarClock className="h-5 w-5 text-primary" /> Upcoming
          </h2>
          <div className="mt-4 space-y-4">
            {isLoading && <p className="text-muted-foreground">Loading…</p>}
            {!isLoading && upcoming.length === 0 && (
              <div className="card-soft p-8 text-center">
                <p className="text-muted-foreground">You have no upcoming consultations.</p>
                <Link to="/doctors" className="btn-primary mt-5">
                  Book a consultation
                </Link>
              </div>
            )}
            {upcoming.map((a) => (
              <div key={a.id} className="card-soft p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <img
                    src={photoFor(a.doctors.photo_key)}
                    alt={a.doctors.name}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-bold">{a.doctors.name}</p>
                    <p className="text-sm text-muted-foreground">{a.doctors.specialty}</p>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {formatSlot(a.scheduled_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/consult/$appointmentId"
                      params={{ appointmentId: a.id }}
                      className="btn-primary py-2 text-sm"
                    >
                      <Video className="h-4 w-4" /> Join call
                    </Link>
                    <button
                      className="btn-ghost py-2 text-sm"
                      onClick={() => {
                        setRescheduling(a);
                        setDayIndex(0);
                      }}
                    >
                      Reschedule
                    </button>
                    <button
                      className="btn-ghost py-2 text-sm text-destructive"
                      onClick={() => cancel.mutate(a.id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {a.reason && (
                  <p className="mt-4 rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
                    Reason: {a.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <History className="h-5 w-5 text-primary" /> Consultation history
          </h2>
          <div className="mt-4 space-y-3">
            {past.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing here yet.</p>
            )}
            {past.map((a) => (
              <div key={a.id} className="card-soft flex flex-wrap items-center gap-4 p-5">
                <img
                  src={photoFor(a.doctors.photo_key)}
                  alt={a.doctors.name}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="h-11 w-11 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold">{a.doctors.name}</p>
                  <p className="text-sm text-muted-foreground">{formatSlot(a.scheduled_at)}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    a.status === "cancelled"
                      ? "bg-secondary text-muted-foreground"
                      : "bg-mint-soft text-accent-foreground"
                  }`}
                >
                  {a.status === "cancelled" ? "Cancelled" : "Completed"}
                </span>
                {a.doctor_notes && (
                  <p className="w-full rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
                    Doctor's notes: {a.doctor_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <p className="mt-12 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-mint" />
          Your records are private, encrypted, and visible only to you and the clinician you booked.
        </p>
      </div>

      {rescheduling && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
          <div className="card-soft w-full max-w-lg p-7">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">Reschedule</h3>
                <p className="text-sm text-muted-foreground">with {rescheduling.doctors.name}</p>
              </div>
              <button aria-label="Close" onClick={() => setRescheduling(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {bookableDays().map((dd, i) => (
                <button
                  key={dd.toISOString()}
                  onClick={() => setDayIndex(i)}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    i === dayIndex
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  {formatDay(dd)}
                </button>
              ))}
            </div>
            <div className="mt-4 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {slotsFor(rescheduling.doctor_id, bookableDays()[dayIndex] ?? new Date()).map((s) => (
                <button
                  key={s.toISOString()}
                  onClick={() =>
                    reschedule.mutate({ id: rescheduling.id, iso: s.toISOString() })
                  }
                  className="rounded-xl border border-border bg-card py-2 text-sm font-semibold transition hover:border-primary hover:bg-sky-soft"
                >
                  {formatTime(s)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
