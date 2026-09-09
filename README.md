# Health Connect Hub

Build a telehealth booking and video consultation web app called "MediConnect" (placeholder name — feel free to rename).

Core features:

Landing page — clean, trustworthy healthcare design (soft blues/greens, clear CTA "Book a Consultation"), brief explainer of how it works (3-step: choose doctor → book slot → video call)

Doctor directory — grid/list of doctors with photo, name, specialty, rating, years of experience, consultation fee, and next available slot. Include filters for specialty, availability, and price range.

Doctor profile page — bio, qualifications, specialties, patient reviews, and a calendar showing available time slots

Booking flow — select date/time → patient enters basic info (name, age, reason for visit) → confirmation screen with appointment summary

Patient dashboard — upcoming appointments, past consultation history, option to reschedule/cancel

Video consultation room — simple UI mockup with video call placeholder, chat sidebar, "End Call" button, and a notes section for the doctor

Authentication — sign up/login for patients (email + password), separate simple login for doctors

Doctor dashboard — list of upcoming appointments, patient details, ability to mark consultation as complete
Design direction:

Clean, modern, medical/healthcare aesthetic — calming colors, rounded cards, lots of white space

Mobile-responsive

Trust signals throughout (verified badges, secure/encrypted messaging notes, ratings)

Tech notes:

Use Supabase for auth and database (patients, doctors, appointments tables)

Keep video call as a UI placeholder for now (can integrate Twilio/Daily.co later)

Focus on booking flow and dashboards first — polish the video call UI last

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://swift-care-call.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a1f3a48e-5110-45ef-b3c1-51e83ceed7c0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
