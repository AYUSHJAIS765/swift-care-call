import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BadgeCheck, Clock, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/site-chrome";
import {
  dayKey,
  formatSlot,
  nextAvailable,
  photoFor,
  specialties,
  type Doctor,
} from "@/lib/mediconnect";

export const Route = createFileRoute("/doctors/")({
  head: () => ({
    meta: [
      { title: "Find a doctor — MediConnect" },
      {
        name: "description",
        content:
          "Browse verified doctors by specialty, price and availability. See ratings, experience and the next free video appointment.",
      },
      { property: "og:title", content: "Find a doctor — MediConnect" },
      {
        property: "og:description",
        content: "Browse verified doctors by specialty, price and availability.",
      },
    ],
  }),
  component: Directory,
});

type Availability = "any" | "today" | "week";

function Directory() {
  const [specialty, setSpecialty] = useState("all");
  const [availability, setAvailability] = useState<Availability>("any");
  const [maxFee, setMaxFee] = useState(150);
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors").select("*").order("rating", {
        ascending: false,
      });
      if (error) throw error;
      return data as unknown as Doctor[];
    },
  });

  const rows = useMemo(() => {
    const today = dayKey(new Date());
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    return (data ?? [])
      .map((d) => ({ doctor: d, slot: nextAvailable(d.id) }))
      .filter(({ doctor, slot }) => {
        if (specialty !== "all" && doctor.specialty !== specialty) return false;
        if (doctor.fee > maxFee) return false;
        if (query && !`${doctor.name} ${doctor.specialty}`.toLowerCase().includes(query.toLowerCase()))
          return false;
        if (availability === "today") return slot ? dayKey(slot) === today : false;
        if (availability === "week") return slot ? slot <= weekEnd : false;
        return true;
      });
  }, [data, specialty, availability, maxFee, query]);

  return (
    <Page>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="text-4xl font-extrabold">Find a doctor</h1>
        <p className="mt-2 text-muted-foreground">
          {rows.length} verified clinician{rows.length === 1 ? "" : "s"} available for video
          consultations.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="card-soft h-fit space-y-6 p-6 lg:sticky lg:top-24">
            <div>
              <label className="text-sm font-bold" htmlFor="search">
                Search
              </label>
              <input
                id="search"
                className="field mt-2"
                placeholder="Name or specialty"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-bold" htmlFor="specialty">
                Specialty
              </label>
              <select
                id="specialty"
                className="field mt-2"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option value="all">All specialties</option>
                {specialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm font-bold">Availability</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["any", "Anytime"],
                    ["today", "Today"],
                    ["week", "This week"],
                  ] as [Availability, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setAvailability(value)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                      availability === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold" htmlFor="fee">
                Max fee: ${maxFee}
              </label>
              <input
                id="fee"
                type="range"
                min={40}
                max={150}
                step={5}
                value={maxFee}
                onChange={(e) => setMaxFee(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--primary)]"
              />
            </div>
          </aside>

          <div className="space-y-4">
            {isLoading && <p className="text-muted-foreground">Loading doctors…</p>}
            {!isLoading && rows.length === 0 && (
              <div className="card-soft p-10 text-center text-muted-foreground">
                No doctors match those filters. Try widening your price range.
              </div>
            )}
            {rows.map(({ doctor: d, slot }) => (
              <div key={d.id} className="card-soft flex flex-col gap-5 p-6 sm:flex-row">
                <img
                  src={photoFor(d.photo_key)}
                  alt={d.name}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold">{d.name}</h2>
                    {d.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2.5 py-1 text-xs font-bold text-primary">
                        <BadgeCheck className="h-3.5 w-3.5" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">{d.specialty}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                    <span className="flex items-center gap-1 font-semibold">
                      <Star className="h-4 w-4 fill-mint text-mint" /> {d.rating}
                      <span className="font-normal text-muted-foreground">
                        ({d.reviews_count} reviews)
                      </span>
                    </span>
                    <span className="text-muted-foreground">{d.years_experience} yrs experience</span>
                    <span className="font-semibold">${d.fee} / consult</span>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-mint" />
                    Next available · {slot ? formatSlot(slot) : "Fully booked"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col justify-center gap-2">
                  <Link to="/doctors/$doctorId" params={{ doctorId: d.id }} className="btn-primary">
                    View profile
                  </Link>
                  <Link to="/book/$doctorId" params={{ doctorId: d.id }} className="btn-ghost">
                    Book now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
