# Voyage AI ✈️

**Plan once. Travel together.** — the AI trip planner that stays on budget, gets your whole group on the same page, and backs every pick with real reviews.

## The 3 pillars

1. **Budget-locked planning** — set the budget first. The agent plans inside it, labels every line confirmed / estimated / rough, warns before going over, and suggests cheaper swaps.
2. **Group-first co-planning** — share a WhatsApp link, collect everyone's comfortable budget, vote on places, and let the agent merge a plan that respects the group's comfort floor.
3. **Review-backed trust** — every place card has a “Why this pick” line; the detail page has an AI pros/cons summary from aggregated reviews. No reviews, no recommendation.

Plus **Travel DNA** — picks, skips and pins quietly personalise the next trip, and every past trip is remixable.

## Features in this MVP

- Chat intake (destination, days, budget, theme, travellers) with quick replies and streaming tool events
- Real Anthropic agent with tools: `search_places`, `get_place_details`, `estimate_cost`, `get_weather`, `get_travel_links`
- Place picker with filters, Add / Pin / Skip and “Why this pick”
- Day-by-day itinerary with drag-to-reorder, closure warnings, per-day cost
- Interactive Leaflet map with numbered day pins and routes
- Live weather forecast / historical typical weather per day (Open-Meteo)
- Budget panel with donut, confidence tags, FX, flights/stays price hints and deep links
- **Group budget check** — invite crew, aggregate comfort range, feed it to the agent
- Group voting, comments, roles, WhatsApp/email invites, `.ics` + print/PDF export
- Public read-only share page with “Remix this trip”
- My Trips library with filters + remix
- Profile / Travel DNA preferences (diet, pace, interests, currency, language)
- Dark mode, mobile bottom nav, ⌘K command palette

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

### Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | optional | Without it, the guided planner + rules-based replies still work. |
| `ANTHROPIC_MODEL` | optional | Defaults to `claude-haiku-4-5-20251001` (cheapest). Try `claude-sonnet-4-5-20250929` for best quality. |

### Keyless integrations (no setup)

- Weather & geocoding — **Open-Meteo**
- Maps — **OpenStreetMap + CARTO** via Leaflet
- FX — **open.er-api.com**
- Flight/hotel hints — deep links to **Google Flights/Hotels**, **Booking.com**, **MakeMyTrip**

> Prices, ratings and hours in the demo dataset are indicative fixtures. Wire a Places provider (Google/Foursquare) before production; the interfaces are isolated in `src/lib/data.ts` and the agent tools.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing, destination autocomplete, trending cities |
| `/plan` | Chat + place picker + itinerary + map + budget |
| `/trips` | Trip library with filters and remix |
| `/trips/[id]` | Board: itinerary drag/drop, map, budget, collaborate |
| `/places/[id]` | Place detail, AI review summary, add to trip |
| `/profile` | Travel DNA & preferences |
| `/share/[id]` | Public read-only itinerary + remix |

## Stack

Next.js 16 · TypeScript · Tailwind v4 · Framer Motion · Zustand · Leaflet · Anthropic SDK · Open-Meteo · OpenStreetMap.
