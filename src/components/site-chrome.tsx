import { Link, useNavigate } from "@tanstack/react-router";
import { HeartPulse, Lock, Menu, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <HeartPulse className="h-5 w-5" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">MediConnect</span>
    </Link>
  );
}

export function SiteHeader() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const links = (
    <>
      <Link to="/doctors" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
        Find a doctor
      </Link>
      {user ? (
        <>
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            My appointments
          </Link>
          <button onClick={signOut} className="btn-ghost py-2 text-sm">
            Sign out
          </button>
        </>
      ) : (
        <>
          <Link to="/auth" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link to="/doctors" className="btn-primary py-2 text-sm">
            Book a consultation
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">{links}</nav>
        <button
          className="md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="flex flex-col items-start gap-4 border-t border-border bg-card px-5 py-5 md:hidden">
          {links}
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <p className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-mint" />
          End-to-end encrypted consultations · Verified clinicians only
        </p>
        <p>© {new Date().getFullYear()} MediConnect</p>
      </div>
    </footer>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
