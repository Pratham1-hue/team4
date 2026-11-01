# Yatri ✈️

**Plan once. Travel together.** — The all-in-one AI travel copilot with encrypted document storage, real-time transit telemetry, weather-aware packing, and group expense resolution.

---

## 🌟 The Core Pillars

1. **Budget-Locked Planning** — Set your group comfort budget first. The AI plans strictly inside it, tags confidence levels on every line item, warns before going over, and suggests cheaper swaps.
2. **Travel Vault (Zero-Knowledge Security)** — Passports, visas, flight/train tickets, and vouchers encrypted with client-side **AES-256-GCM**, protected by biometric/PIN authentication, and accessible 100% offline.
3. **Live Transit & Weather Radar** — Real-time flight tracking (Duffel API) & Indian Railways live running status (RapidAPI), integrated with live airport weather hazard detection (WeatherAPI.com).
4. **Group Expense & Debt Simplification** — Multi-currency split engine that calculates the absolute minimum number of transfers to settle group debts, with instant WhatsApp export.
5. **Weather-Smart Packing Assistant** — Dynamic checklist tailored to your destination's live 7-day forecast with a baggage weight monitor.
6. **Emergency Safety Hub** — 1-tap country dispatch dialers, full-screen paramedic medical card, and offline emergency phrasebook.

---

## 📱 Modules & Features

### 🛡️ 1. Travel Vault (`/vault`)
* **Client-Side AES-256-GCM Encryption**: Key derived using PBKDF2 (100,000 iterations, SHA-256); zero unencrypted files ever touch the network.
* **Biometric & PIN Lock**: WebAuthn platform authenticator (TouchID, FaceID, Windows Hello) with 4-digit PIN fallback.
* **Offline IndexedDB Cache**: Keep encrypted local copies on your device for access without cellular or Wi-Fi.
* **Expiry Reminders**: Automatic alerts at 90, 30, and 7 days before passport/visa expiration.
* **Expiring Signed Links**: Generate temporary self-destructing links (1 hour, 24 hours, 7 days) to share tickets or vouchers.
* **Audit Trail**: Immutable log of views, downloads, shares, and deletions.

### ✈️ 2. Real-Time Flight & Train Tracker (`/flights`)
* **Live Status**: On-time, delayed, boarding, in-air timeline, gate, terminal, and baggage carousel updates.
* **Weather-Aware Radar**: Fetches live runway winds, crosswinds, and ceiling precipitation from WeatherAPI.com to warn of potential holding patterns.
* **Indian Railways (IRCTC)**: Live train tracking with current station, speed (km/h), platform numbers, and coach layout.
* **Auto-Detect From Vault**: 1-click button that inspects Vault tickets and starts tracking flight/train journeys immediately.

### 💰 3. Group Expense Splitter (`/expenses`)
* **Multi-Currency Logging**: INR, USD, EUR, GBP, AED, THB.
* **Debt Simplification Algorithm**: Resolves net group balances into the fewest possible direct transfers.
* **WhatsApp Share**: Formats settlement summaries for group chats with one tap.

### 🎒 4. Weather-Smart Packing Assistant (`/packing`)
* **Forecast-Driven**: Recommends umbrellas for rain, cardigans for cool nights, and SPF 50+ for high UV indices based on real weather data.
* **Baggage Weight Tracker**: Monitors packed items against airline carry-on (7 kg) and checked limits.

### 🚨 5. Emergency Safety Hub (`/safety`)
* **1-Tap Emergency Dialers**: Police, Ambulance, Fire, and Tourist Helplines for India, UAE, UK, EU, US, Thailand, and Japan.
* **Paramedic Medical Card**: High-contrast offline emergency profile displaying blood group, allergies, ICE contacts, and insurance details from the Vault.
* **Spoken Phrasebook**: Key medical and police phrases with phonetic pronunciation and text-to-speech playback.

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/Pratham1-hue/team4.git
cd team4

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

Configure your keys in `.env.local`:

| Variable | Provider | Purpose |
| :--- | :--- | :--- |
| `WEATHER_API_KEY` | [WeatherAPI.com](https://www.weatherapi.com/) | Live destination forecasts & airport weather hazard radar |
| `DUFFEL_ACCESS_TOKEN` | [Duffel](https://duffel.com/) | Commercial flight lookup & airline route telemetry |
| `RAPIDAPI_KEY` | [RapidAPI](https://rapidapi.com/) | Indian Railways (IRCTC) live train running status & PNR |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) | LLM brain for travel planning recommendations |
| `ANTHROPIC_API_KEY` | [Anthropic](https://anthropic.com/) | Claude-powered itinerary co-planner |

*Note: All modules feature realistic deterministic fallbacks so the app runs smoothly with or without live API keys.*

---

## 🗺️ Application Routes

| Route | Purpose |
| :--- | :--- |
| `/` | Landing page, trending destinations, and intake bar |
| `/plan` | AI chat intake, place picker, day-by-day itinerary, and map |
| `/trips` | My Trips library with filtering and remixing |
| `/trips/[id]` | Trip dashboard with itinerary, map, budget, and toolkit links |
| `/vault` | Encrypted Travel Vault with PIN & biometric lock |
| `/flights` | Real-time flight & Indian Railways tracking with weather alerts |
| `/expenses` | Group expense logger and minimal debt settlement resolver |
| `/packing` | Forecast-synced packing checklist with baggage weight monitor |
| `/safety` | Country emergency dialers, paramedic card, and phrasebook |
| `/share/vault/[token]` | Temporary expiring share link viewer for encrypted documents |
| `/profile` | Travel DNA, dietary preferences, and travel pace |

---

## 🛠️ Tech Stack

* **Framework**: Next.js 16.4.3 (App Router with Turbopack)
* **Frontend**: React 19, TypeScript 5, Tailwind CSS v4, Framer Motion 14, Lucide React
* **State & Local Storage**: Zustand with localStorage & IndexedDB encrypted blob storage
* **Cryptography**: Web Crypto API (AES-256-GCM, PBKDF2) + WebAuthn Credentials API
* **Mapping**: Leaflet + OpenStreetMap + CARTO
* **External APIs**: WeatherAPI.com, Open-Meteo, Duffel, RapidAPI, Gemini, Anthropic

---

## 📄 License

MIT © 2026 Yatri. All rights reserved.
