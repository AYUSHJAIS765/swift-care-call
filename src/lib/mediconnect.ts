import doc1 from "@/assets/doc-1.jpg";
import doc2 from "@/assets/doc-2.jpg";
import doc3 from "@/assets/doc-3.jpg";
import doc4 from "@/assets/doc-4.jpg";
import doc5 from "@/assets/doc-5.jpg";
import doc6 from "@/assets/doc-6.jpg";

export const photos: Record<string, string> = {
  "doc-1": doc1,
  "doc-2": doc2,
  "doc-3": doc3,
  "doc-4": doc4,
  "doc-5": doc5,
  "doc-6": doc6,
};

export function photoFor(key: string) {
  return photos[key] ?? doc1;
}

export type Doctor = {
  id: string;
  name: string;
  email: string;
  specialty: string;
  bio: string;
  qualifications: string[];
  languages: string[];
  photo_key: string;
  rating: number;
  reviews_count: number;
  years_experience: number;
  fee: number;
  verified: boolean;
};

export type Appointment = {
  id: string;
  doctor_id: string;
  patient_id: string;
  patient_name: string;
  patient_age: number | null;
  reason: string;
  scheduled_at: string;
  status: string;
  doctor_notes: string;
};

/** Deterministic pseudo-random so slot availability is stable across renders. */
function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The next 14 calendar days, weekdays only. */
export function bookableDays(): Date[] {
  const days: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 21 && days.length < 12; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    days.push(d);
  }
  return days;
}

/** Slots for a doctor on a given day, already filtered to those still open. */
export function slotsFor(doctorId: string, day: Date): Date[] {
  const out: Date[] = [];
  const now = Date.now();
  for (let h = 9; h < 17; h++) {
    for (const m of [0, 30]) {
      const slot = new Date(day);
      slot.setHours(h, m, 0, 0);
      if (slot.getTime() < now + 30 * 60 * 1000) continue;
      if (hash(doctorId + slot.toISOString()) % 3 === 0) continue;
      out.push(slot);
    }
  }
  return out;
}

export function nextAvailable(doctorId: string): Date | null {
  for (const day of bookableDays()) {
    const slots = slotsFor(doctorId, day);
    if (slots.length) return slots[0]!;
  }
  return null;
}

export function formatSlot(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatDay(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const today = new Date();
  if (dayKey(date) === dayKey(today)) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (dayKey(date) === dayKey(tomorrow)) return "Tomorrow";
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export const specialties = [
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "General Practice",
  "Psychiatry",
  "Orthopedics",
];
