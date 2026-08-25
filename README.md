# ExampleIQ Booking Form

A responsive recreation of the supplied ExampleIQ booking form. The initial desktop layout is sized to match the 651x959 reference image while the form remains usable on narrow screens.

## Demo Video

A screen recording of the running form — the booking flow end to end, against the mock data described below.

[Watch booking-form.mp4 on Google Drive](https://drive.google.com/file/d/1TmuA52hyaFEOV3_NKrE2l10NriOdM5Cz/view?usp=sharing)

## Mock Data

**This build runs entirely on mock data. No Google API key is configured, and none is needed to run or review it.** Nothing here talks to a third-party service:

- **Place suggestions** come from a fixed list in `lib/places.ts`, not the Google Places API. Airports and other locations are two disjoint sets, one per tab.
- **Distance and travel time** are deterministic local estimates from `lib/route-estimate.ts`, labelled in the UI as "Approximate until Google Maps is configured."
- **Bookings and customers** go to the mock routes under `app/api`, backed by an in-memory store plus browser `localStorage`.

Every part of the booking flow — validation, customer recognition, the estimate, submission and the confirmation — is exercisable as-is. See [Google Maps](#google-maps) for what changes if a key is added later.

## Run Locally

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

The production checks are:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Project Structure

```
src/
  app/                     routing only: the page, the root layout, the mock API
    api/bookings/route.ts  validates a booking and returns a reference
    api/customers/route.ts phone lookup and customer save
  components/
    ui/                    reusable, booking-agnostic: form primitives and icons
    booking-form/          the form itself, one file per part of the flow
      hooks/               all form state, in use-booking-form.ts
      types.ts             the form's own types
  lib/                     domain rules, API client, and the mock data stores
```

`lib/booking.ts` holds the booking model and every validation rule, so the form
and the API routes agree on what a valid booking is. `use-booking-form.ts` owns
all form state; the components render what it returns.

## Google Maps

Optional, and **not** set up in this build — the form falls back to the mock estimate described above, which is the path everything is currently running on.

The seam exists if live results are wanted later: when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is present, the client loads the Google Maps JavaScript API with the Places library and, as the pickup and drop off change, calls `DistanceMatrixService` with driving mode and imperial units, then displays the returned distance and duration.

To enable it:

1. Create or select a Google Cloud project.
2. Enable **Maps JavaScript API** and **Distance Matrix API**.
3. Create a browser-restricted API key.
4. Copy `.env.example` to `.env.local` and add the key:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-browser-key
```

5. Restart the development server.

Without a key — the current state — the form uses a clearly marked deterministic estimate so the booking flow can still be tested locally. A configured key is required for live Google results. Note that place suggestions stay mocked either way; only the distance and travel time switch over.

## Booking Flow

- The supplied values are intentionally the initial values shown in the reference image.
- Date, time, locations, phone, contact information, and passenger count are validated before submission.
- The seeded recognized-customer demo number is `+1 617 555 0100`. It greets the customer as Alex and hides the extra contact fields.
- Any other valid phone number follows the new-customer path and requests first name, last name, and email.
- A successful booking saves the customer in browser `localStorage` and in the mock server store, so the same browser recognizes the number on later visits.
- **+ Add a stop** adds an optional stop field that can be completed or removed.
- **Continue** submits to `POST /api/bookings`.

The mock endpoints are:

- `GET /api/customers?phone=...` recognizes a phone number.
- `POST /api/customers` validates and saves customer details.
- `POST /api/bookings` validates a booking, saves its customer, and returns a generated booking id.

The server store is intentionally in memory for this mock implementation, so it resets whenever the server restarts. Browser `localStorage` preserves recognized customers across those restarts.
