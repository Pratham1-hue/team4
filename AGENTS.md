# Voyage AI — AGENTS.md

## Product
**Plan once. Travel together.**
An AI travel planner for friend groups (India-first, INR) that:
1. **Budget-locked planning** — the budget is a promise. Every line item has a confidence tag (confirmed / estimated / rough). Over-budget picks trigger a warning + cheaper swap.
2. **Group-first co-planning** — invite via WhatsApp link, collect each person's comfortable budget, vote on places, and merge into one plan that respects the group.
3. **Review-backed trust** — every card has a “Why this pick” line and an AI pros/cons summary. No review data, no recommendation.
4. **Travel DNA** — picks, skips and pins feed a lightweight taste profile; past trips are remixable.

## Stack (implemented)
- Next.js 16 (App Router) + TypeScript + Tailwind v4 + Framer Motion + Zustand
- Leaflet + OpenStreetMap/CARTO (real map, keyless)
- Open-Meteo forecast + historical “typical weather” (keyless)
- Open-Meteo geocoding autocomplete (keyless)
- open.er-api.com FX (keyless)
- Anthropic SDK behind `POST /api/agent` — tool use + SSE streaming; defaults to `claude-haiku-4-5-20251001`; automatic local fallback when `ANTHROPIC_API_KEY` is absent.

## Routes
- `/` landing · `/plan` chat workspace · `/trips` library · `/trips/[id]` board
- `/places/[id]` review-backed detail · `/profile` Travel DNA & prefs · `/share/[id]` public read-only

## APIs
- `POST /api/agent` { messages, context } → SSE tokens + tool events. Context includes trip, selected places, **groupBudget** and origin.
- `GET /api/weather?lat&lng&start&end&name`
- `GET /api/geocode?q`
- `GET /api/rates?base=INR`

## Rules
1. Never hard-code keys; read from `.env.local`; keep `.env.example` current.
2. Never fabricate prices/ratings/hours in agent replies — use tools; label estimates as indicative.
3. The group's comfort floor (`recommended`) is a hard constraint: warn before exceeding it.
4. Every price line shows a confidence label and source/fetched-at where live data is used.
5. Mobile-first, dark mode, accessible focus states, loading/empty/error states everywhere.
6. Prefer deterministic local flows as fallback when external services fail.

## Commands
- `npm run dev` · `npm run build` · `npm start` · `npm run lint`

## Definition of done
Feature works end-to-end on mobile and desktop, degrades gracefully offline, and respects the budget/group trust promise.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
