# Yatri — AGENTS.md

## Product
**Plan once. Travel together.**
An intelligent travel copilot for friend groups (India-first, INR) that:
1. **Budget-locked planning** — the budget is a promise. Every line item has a confidence tag (confirmed / estimated / rough). Over-budget picks trigger a warning + cheaper swap.
2. **Travel Vault (Zero-Knowledge AES-256)** — securely stores passports, visas, flight/train tickets, and hotel bookings with PIN/biometric unlock, offline access, expiry tracking, and temporary share links.
3. **Live Transit & Weather Alerts** — real-time flight tracking (Duffel API) and Indian Railways IRCTC live train tracking (RapidAPI), joined with live runway weather alerts (WeatherAPI.com).
4. **Group Expense & Debt Simplification** — tracks group expenses across currencies and computes minimal settlement transfers for WhatsApp.
5. **Weather-Smart Packing** — generates packing lists synced with destination 7-day forecasts and monitors carry-on baggage weight.
6. **Emergency Safety Hub** — instant country emergency numbers, offline paramedic medical card, and translated phrases.

## Stack (implemented)
- Next.js 16 (App Router) + TypeScript + Tailwind v4 + Framer Motion + Zustand
- Web Crypto API (AES-256-GCM, PBKDF2) + WebAuthn Platform Biometrics + IndexedDB
- WeatherAPI.com & Open-Meteo live weather radar (keyless fallback)
- Duffel Flights & RapidAPI Indian Railways integrations with realistic simulated fallback
- Leaflet + OpenStreetMap/CARTO (real map, keyless)
- open.er-api.com FX (keyless)
- Anthropic SDK & Google Gemini API behind `POST /api/agent` — tool use + SSE streaming; automatic local fallback when keys are absent.

## Routes
- `/` landing · `/plan` chat workspace · `/trips` library · `/trips/[id]` board
- `/vault` encrypted storage · `/flights` transit tracker · `/expenses` debt splitter
- `/packing` weather packing checklist · `/safety` emergency toolkit · `/profile` Travel DNA
- `/share/vault/[token]` expiring secure doc link · `/share/[id]` public trip share

## APIs
- `POST /api/agent` { messages, context } → SSE tokens + tool events.
- `GET /api/weather?lat&lng&start&end&name` → WeatherAPI / Open-Meteo live forecast.
- `GET /api/flights/track?flight&date` → Duffel / live status + runway weather radar.
- `GET /api/railways/track?train&date&pnr` → RapidAPI / IRCTC live train telemetry.
- `POST /api/vault/share` → Generates signed expiring share tokens.

## Rules
1. Never hard-code keys; read from `.env.local`; keep `.env.example` current.
2. Never fabricate prices/ratings/hours in agent replies — use tools; label estimates as indicative.
3. The group's comfort floor (`recommended`) is a hard constraint: warn before exceeding it.
4. Client-side zero-knowledge encryption: unencrypted Vault documents must never be sent over the wire or stored in public buckets.
5. Mobile-first, dark mode, accessible focus states, loading/empty/error states everywhere.
6. Prefer deterministic local flows as fallback when external services fail.

## Commands
- `npm run dev` · `npm run build` · `npm start` · `npm run lint`

## Definition of done
Feature works end-to-end on mobile and desktop, degrades gracefully offline, and respects the budget/group trust promise.
