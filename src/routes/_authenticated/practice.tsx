import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, ShieldCheck, Stethoscope, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/site-chrome";
import { formatSlot, photoFor, type Appointment, type Doctor } from "@/lib/mediconnect";

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({
    meta: [
      { title: "Clinician portal — MediConnect" },
      {
        name: "description",
        content:
          "Your MediConnect schedule: upcoming patient consultations, reasons for visit, and completed appointments.",
      },
      { property: "og:title", content: "Clinician portal — MediConnect" },
      { property: "og:description", content: "Today's schedule and patient details for clinicians." },
    ],
  }),
  component: Practice,
});

function Practice() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["practice"],
    queryFn: async () => {
      const claim = await supabase.rpc("claim_doctor_profile");
      const { data: userData } = await supabase.auth.getUser();
      const { data: doctor } = await supabase
        .from("doctors")
        .select("*")
        .eq("user_id", userData.user!.id)
        .maybeSingle();
      if (!doctor) return { doctor: null, appointments: [] as Appointment[], claim: claim.data };
      const { data: appts, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", (doctor as unknown as Doctor).id)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return {
        doctor: doctor as unknown as Doctor,
        appointments: (appts ?? []) as unknown as Appointment[],
        claim: claim.data,
      };
    },
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "completed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["practice"] }),
  });

  if (isLoading) {
    return (
      <Page>
        <p className="mx-auto max-w-5xl px-5 py-20 text-muted-foreground">Loading your schedule…</p>
      </Page>
    );
  }

  if (!data?.doctor) {
    return (
      <Page>
        <div className="mx-auto max-w-xl px-5 py-20 text-center">
          <Stethoscope className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-5 text-2xl font-extrabold">No clinician listing linked</h1>
          <p className="mt-3 text-muted-foreground">
            This account isn't linked to a doctor profile yet. Sign up using the email address on
            your MediConnect listing and it will connect automatically.
          </p>
          <Link to="/dashboard" className="btn-ghost mt-7">
            Go to patient dashboard
          </Link>
        </div>
      </Page>
    );
  }

  const doctor = data.doctor;
  const now = Date.now();
  const upcoming = data.appointments.filter(
    (a) => a.status === "upcoming" && new Date(a.scheduled_at).getTime() > now - 60 * 60 * 1000,
  );
  const done = data.appointments.filter((a) => !upcoming.includes(a));

  return (
    <Page>
      <div className="mx-auto max-w-4xl px-5 py-12">
        <div className="card-soft flex items-center gap-4 p-6">
          <img
            src={photoFor(doctor.photo_key)}
            alt={doctor.name}
            width={512}
            height={512}
            className="h-16 w-16 rounded-2xl object-cover"
          />
          <div>
            <h1 className="text-2xl font-extrabold">{doctor.name}</h1>
            <p className="text-sm text-muted-foreground">
              {doctor.specialty} · {upcoming.length} upcoming consultation
              {upcoming.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <h2 className="mt-10 flex items-center gap-2 text-xl font-bold">
          <CalendarClock className="h-5 w-5 text-primary" /> Upcoming consultations
        </h2>
        <div className="mt-4 space-y-4">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing booked right now.</p>
          )}
          {upcoming.map((a) => (
            <div key={a.id} className="card-soft p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-bold">
                    {a.patient_name}
                    {a.patient_age ? `, ${a.patient_age}` : ""}
                  </p>
                  <p className="text-sm font-semibold text-primary">{formatSlot(a.scheduled_at)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/consult/$appointmentId"
                    params={{ appointmentId: a.id }}
                    className="btn-primary py-2 text-sm"
                  >
                    <Video className="h-4 w-4" /> Start call
                  </Link>
                  <button className="btn-ghost py-2 text-sm" onClick={() => complete.mutate(a.id)}>
                    <CheckCircle2 className="h-4 w-4" /> Mark complete
                  </button>
                </div>
              </div>
              {a.reason && (
                <p className="mt-4 rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
                  Reason for visit: {a.reason}
                </p>
              )}
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold">Completed &amp; past</h2>
        <div className="mt-4 space-y-3">
          {done.length === 0 && <p className="text-sm text-muted-foreground">No history yet.</p>}
          {done.map((a) => (
            <div key={a.id} className="card-soft flex flex-wrap items-center gap-3 p-5">
              <div className="flex-1">
                <p className="font-semibold">{a.patient_name}</p>
                <p className="text-sm text-muted-foreground">{formatSlot(a.scheduled_at)}</p>
              </div>
              <span className="rounded-full bg-mint-soft px-3 py-1 text-xs font-bold text-accent-foreground">
                {a.status === "cancelled" ? "Cancelled" : "Completed"}
              </span>
              {a.doctor_notes && (
                <p className="w-full rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
                  Notes: {a.doctor_notes}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="mt-12 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-mint" />
          Patient information is confidential and encrypted in transit and at rest.
        </p>
      </div>
    </Page>
  );
}
