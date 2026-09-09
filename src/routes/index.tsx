import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarCheck,
  Lock,
  Search,
  ShieldCheck,
  Star,
  Video,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/site-chrome";
import { formatSlot, nextAvailable, photoFor, type Doctor } from "@/lib/mediconnect";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediConnect — See a verified doctor by video, today" },
      {
        name: "description",
        content:
          "Book a video consultation with verified doctors in minutes. Browse specialists, pick a time that suits you, and meet securely online.",
      },
      { property: "og:title", content: "MediConnect — See a verified doctor by video, today" },
      {
        property: "og:description",
        content:
          "Book a video consultation with verified doctors in minutes. Browse specialists, pick a time, meet securely online.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    icon: Search,
    title: "Choose your doctor",
    body: "Filter by specialty, price and availability. Every clinician is licence-checked before joining.",
  },
  {
    icon: CalendarCheck,
    title: "Book a slot",
    body: "Pick a time from their live calendar and tell them briefly what's going on. Takes under a minute.",
  },
  {
    icon: Video,
    title: "Join the video call",
    body: "Meet from your phone or laptop. Notes and any prescription land in your dashboard afterwards.",
  },
];

function Landing() {
  const { data: doctors } = useQuery({
    queryKey: ["featured-doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .order("rating", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data as unknown as Doctor[];
    },
  });

  return (
    <Page>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -right-32 h-96 w-96 rounded-full bg-mint-soft blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-sky-soft blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-mint-soft px-3 py-1.5 text-xs font-bold text-accent-foreground">
              <ShieldCheck className="h-4 w-4" /> Licence-verified clinicians
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] md:text-6xl">
              Care that fits
              <br />
              around your day.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Talk to a doctor by secure video — usually the same day. No waiting rooms, no
              commute, notes saved to your dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/doctors" className="btn-primary">
                Book a Consultation
              </Link>
              <Link to="/auth" className="btn-ghost">
                I'm a doctor
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-mint text-mint" /> 4.9 average from 12,400 consults
              </span>
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-mint" /> Encrypted, private by design
              </span>
            </div>
          </div>
          <div className="relative">
            <img
              src={hero}
              alt="A patient having a video consultation with a doctor from home"
              width={1280}
              height={960}
              className="w-full rounded-3xl object-cover shadow-[var(--shadow-lift)]"
            />
            <div className="card-soft absolute -bottom-6 left-4 hidden items-center gap-3 p-4 sm:flex">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-soft">
                <BadgeCheck className="h-5 w-5 text-mint" />
              </span>
              <div>
                <p className="text-sm font-bold">Next appointment</p>
                <p className="text-xs text-muted-foreground">Dr. Novak · in 12 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-extrabold">How it works</h2>
        <p className="mt-2 text-muted-foreground">Three steps, about two minutes.</p>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="card-soft p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-soft text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <p className="mt-5 text-xs font-bold tracking-widest text-muted-foreground">
                STEP {i + 1}
              </p>
              <h3 className="mt-1 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-4">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-extrabold">Top rated this month</h2>
          <Link to="/doctors" className="text-sm font-semibold text-primary hover:underline">
            See all doctors
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(doctors ?? []).map((d) => {
            const slot = nextAvailable(d.id);
            return (
              <Link
                key={d.id}
                to="/doctors/$doctorId"
                params={{ doctorId: d.id }}
                className="card-soft p-6 transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={photoFor(d.photo_key)}
                    alt={d.name}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                  <div>
                    <p className="flex items-center gap-1.5 font-bold">
                      {d.name}
                      {d.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    </p>
                    <p className="text-sm text-muted-foreground">{d.specialty}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
                      <Star className="h-3.5 w-3.5 fill-mint text-mint" /> {d.rating}
                      <span className="font-normal text-muted-foreground">
                        ({d.reviews_count})
                      </span>
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Next available · {slot ? formatSlot(slot) : "Fully booked"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-5">
        <div className="rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground">
          <h2 className="text-3xl font-extrabold md:text-4xl">Feeling unwell? Start now.</h2>
          <p className="mx-auto mt-3 max-w-lg opacity-90">
            Most patients are speaking to a doctor within the hour.
          </p>
          <Link
            to="/doctors"
            className="mt-8 inline-flex rounded-full bg-card px-7 py-3.5 font-bold text-primary transition hover:brightness-105"
          >
            Book a Consultation
          </Link>
        </div>
      </section>
    </Page>
  );
}
