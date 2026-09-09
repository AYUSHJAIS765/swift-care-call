import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/site-chrome";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account — MediConnect" },
      {
        name: "description",
        content:
          "Sign in to manage your MediConnect video consultations, or create a patient account in under a minute. Doctors sign in here too.",
      },
      { property: "og:title", content: "Sign in — MediConnect" },
      {
        property: "og:description",
        content: "Access your MediConnect appointments, or sign in to your clinician portal.",
      },
    ],
  }),
  component: Auth,
});

type Mode = "signin" | "signup";
type Who = "patient" | "doctor";

function Auth() {
  const navigate = useNavigate();
  const [who, setWho] = useState<Who>("patient");
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void afterAuth();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function afterAuth() {
    const claimed = await supabase.rpc("claim_doctor_profile");
    const next = typeof window !== "undefined" ? sessionStorage.getItem("mc_next") : null;
    sessionStorage.removeItem("mc_next");
    if (claimed.data) {
      navigate({ to: "/practice", replace: true });
      return;
    }
    if (next) {
      window.location.href = next;
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, role: who },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Almost there — check your inbox and click the confirmation link to finish.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      await afterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold">
            {who === "patient" ? "Your care, in one place" : "Clinician portal"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {who === "patient"
              ? "Sign in to book appointments, join video calls and review past consultations."
              : "Sign in to see today's schedule, patient details and consultation notes."}
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-mint" />
              <span>Every clinician is licence-verified before they can accept bookings.</span>
            </li>
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-mint" />
              <span>Messages, notes and video are encrypted end to end.</span>
            </li>
          </ul>
          {who === "doctor" && (
            <div className="card-soft mt-8 p-5 text-sm text-muted-foreground">
              <p className="font-bold text-foreground">Demo clinician accounts</p>
              <p className="mt-1">
                Create an account with one of the listing emails (for example
                <span className="font-semibold"> sarah.chen@mediconnect.health</span>) and it links
                automatically to that doctor's profile and schedule.
              </p>
            </div>
          )}
        </div>

        <div className="card-soft p-7">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1.5">
            {(
              [
                ["patient", "I'm a patient", UserRound],
                ["doctor", "I'm a doctor", Stethoscope],
              ] as [Who, string, typeof UserRound][]
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                onClick={() => setWho(value)}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
                  who === value ? "bg-card shadow-[var(--shadow-soft)]" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-sm font-bold" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  className="field mt-1.5"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="text-sm font-bold" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="field mt-1.5"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-bold" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="field mt-1.5"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
            {notice && <p className="text-sm font-semibold text-mint">{notice}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to MediConnect?" : "Already registered?"}{" "}
            <button
              className="font-bold text-primary hover:underline"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
                setNotice("");
              }}
            >
              {mode === "signin" ? "Create an account" : "Sign in instead"}
            </button>
          </p>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Browsing first? <Link to="/doctors" className="underline">See our doctors</Link>
          </p>
        </div>
      </div>
    </Page>
  );
}
