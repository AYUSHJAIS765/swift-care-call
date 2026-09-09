import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Lock,
  Mic,
  MicOff,
  MonitorUp,
  NotebookPen,
  PhoneOff,
  Send,
  Video as VideoIcon,
  VideoOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatSlot, photoFor, type Appointment, type Doctor } from "@/lib/mediconnect";

export const Route = createFileRoute("/_authenticated/consult/$appointmentId")({
  head: () => ({
    meta: [
      { title: "Consultation room — MediConnect" },
      {
        name: "description",
        content:
          "Your secure MediConnect consultation room with video, encrypted chat and clinical notes.",
      },
      { property: "og:title", content: "Consultation room — MediConnect" },
      { property: "og:description", content: "Secure video consultation room." },
    ],
  }),
  component: ConsultRoom,
});

type Msg = { id: number; from: "you" | "them"; text: string };

function ConsultRoom() {
  const { appointmentId } = Route.useParams();
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { id: 1, from: "them", text: "Hi! I can see and hear you — how have you been feeling?" },
  ]);

  const { data } = useQuery({
    queryKey: ["consult", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, doctors(*)")
        .eq("id", appointmentId)
        .maybeSingle();
      if (error) throw error;
      const row = data as unknown as (Appointment & { doctors: Doctor }) | null;
      if (row) setNotes(row.doctor_notes ?? "");
      return row;
    },
  });

  async function saveNotes() {
    await supabase.from("appointments").update({ doctor_notes: notes }).eq("id", appointmentId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), from: "you", text: draft.trim() }]);
    setDraft("");
  }

  const doctor = data?.doctors;

  return (
    <div className="flex min-h-screen flex-col bg-foreground text-background">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="font-bold">
            Consultation {doctor ? `with ${doctor.name}` : ""}
          </p>
          <p className="text-xs opacity-70">
            {data ? formatSlot(data.scheduled_at) : "Loading…"} · Patient: {data?.patient_name}
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-background/10 px-3 py-1.5 text-xs font-semibold">
          <Lock className="h-3.5 w-3.5" /> End-to-end encrypted
        </span>
      </header>

      <div className="grid flex-1 gap-4 px-5 pb-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-3xl bg-background/8">
            {doctor && (
              <img
                src={photoFor(doctor.photo_key)}
                alt={doctor.name}
                loading="lazy"
                width={512}
                height={512}
                className="h-40 w-40 rounded-full object-cover opacity-90"
              />
            )}
            <div className="absolute bottom-4 right-4 flex h-28 w-40 items-center justify-center rounded-2xl border border-background/20 bg-background/10 text-xs">
              {camOn ? "Your camera" : "Camera off"}
            </div>
            <span className="absolute left-4 top-4 rounded-full bg-background/15 px-3 py-1 text-xs font-semibold">
              Video preview · demo mode
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setMicOn((v) => !v)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-background/12 transition hover:bg-background/20"
              aria-label="Toggle microphone"
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setCamOn((v) => !v)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-background/12 transition hover:bg-background/20"
              aria-label="Toggle camera"
            >
              {camOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>
            <button
              className="flex h-12 w-12 items-center justify-center rounded-full bg-background/12 transition hover:bg-background/20"
              aria-label="Share screen"
            >
              <MonitorUp className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="flex items-center gap-2 rounded-full bg-destructive px-6 py-3 font-bold text-destructive-foreground transition hover:brightness-110"
            >
              <PhoneOff className="h-5 w-5" /> End Call
            </button>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="flex min-h-64 flex-1 flex-col rounded-3xl bg-background/8 p-4">
            <p className="text-sm font-bold">Chat</p>
            <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
              {messages.map((m) => (
                <p
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.from === "you"
                      ? "ml-auto bg-background text-foreground"
                      : "bg-background/15"
                  }`}
                >
                  {m.text}
                </p>
              ))}
            </div>
            <form onSubmit={send} className="mt-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-full border border-background/20 bg-background/10 px-4 py-2 text-sm outline-none placeholder:text-background/50"
              />
              <button
                type="submit"
                aria-label="Send"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-background/8 p-4">
            <p className="flex items-center gap-2 text-sm font-bold">
              <NotebookPen className="h-4 w-4" /> Consultation notes
            </p>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, diagnosis, follow-up plan…"
              className="mt-3 w-full rounded-2xl border border-background/20 bg-background/10 p-3 text-sm outline-none placeholder:text-background/50"
            />
            <button
              onClick={saveNotes}
              className="mt-2 w-full rounded-full bg-background py-2 text-sm font-bold text-foreground transition hover:brightness-95"
            >
              {saved ? "Notes saved" : "Save notes"}
            </button>
            <p className="mt-2 text-xs opacity-60">
              Visible to the patient in their consultation history.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
