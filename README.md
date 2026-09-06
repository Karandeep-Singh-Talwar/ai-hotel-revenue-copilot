# AI Hotel Revenue Intelligence Platform & WhatsApp Copilot (AMS)

An enterprise-grade, event-driven Revenue Management System designed specifically for independent luxury and boutique Indian hotels (such as properties across Delhi NCR, Rajasthan, and Mumbai).

Operates on the **Orchestrated Hybrid ("Manager + Chef") Design Pattern**:
- **The Next.js Application Gateway ("The Manager"):** Handles external integration networking, asynchronous background queue processing, web scraping, and instant HTTP responses (< 2s) for Meta WhatsApp Cloud API webhooks.
- **The Neon Serverless PostgreSQL Database ("The Chef"):** Transactionally secures all state changes. All writes, updates, and rate approvals execute strictly through optimized PL/pgSQL Stored Procedures (Functions) under Row-Level Security (RLS) multi-tenant contexts. Direct, unverified table writes from the web client are strictly prohibited.

---

## Architecture Overview

```
                          ┌───────────────────────────┐
                          │   Meta WhatsApp Cloud     │
                          │   Hotelier Interaction    │
                          └─────────────┬─────────────┘
                                        │ Webhook POST (< 2s ACK)
                                        ▼
┌─────────────────────────┐       ┌───────────────────────────┐       ┌───────────────────────────┐
│ External OTAs           │       │  Next.js 14 API Gateway   │       │  Channel Managers         │
│ Agoda / Booking / MMT   │◄──────┤     ("The Manager")       ├──────►│  eZee Centrix/SiteMinder  │
└───────────▲─────────────┘       └─────────────┬─────────────┘       └───────────────────────────┘
            │                                   │
   Scout Scraper Engine                         │ Stored Procedure Calls
   (Playwright + TLS JA3)                       │ RLS: app.current_agency_id
            │                                   ▼
┌───────────┴─────────────┐       ┌───────────────────────────┐
│ Event Scrapers          │       │  Neon Serverless Postgres │
│ BookMyShow / Venues     │       │       ("The Chef")        │
└───────────▲─────────────┘       │  PL/pgSQL SecurityDefiner │
            │                     └───────────────────────────┘
┌───────────┴─────────────┐
│ Econometric Brain       │
│ Kaplan-Meier + XGBoost  │
└─────────────────────────┘
```

---

## 1. Database Architecture & Multi-Tenancy (Neon PostgreSQL)

### Multi-Tenancy & Row-Level Security (RLS)
The database schema natively supports **Revenue Management Agencies (RMAs)** managing multiple client hotels from a single account, as well as standalone hoteliers. All tables are bounded by `agency_id` contexts:
- Session setting: `SET LOCAL app.current_agency_id = '<agency_uuid>';`
- Stored procedures run with `SECURITY DEFINER` and verify tenant permissions.

### Core PL/pgSQL Stored Procedures:
1. `update_comp_set(p_hotel_id INT, p_competitor_ids INT[])`:
   - Transactionally updates active competitor associations.
   - Deactivates unselected competitors while **preserving all historical price records** for econometric backtesting.
2. `insert_rate_observation(...)`:
   - Ingests freshly scraped room rates with `ON CONFLICT (entity_type, entity_id, stay_date, normalized_room_type, source_channel, observation_date) DO UPDATE`.
   - Prevents duplicate observations during overlapping scrape windows.
3. `approve_recommendation(p_rec_id INT)`:
   - Sets recommendation status to `'Approved'`, timestamps application, updates hotel standard rate, and returns a JSON payload with PMS credentials for downstream Channel Manager routing.

---

## 2. Scraping Engine (Python)

### Competitor Rate Scraper (`engine/scrapers/scout_scraper.py`)
- **Anti-Bot Evasion:** Employs headless Playwright automation and Cloudscraper with JA3 TLS browser fingerprint emulation to bypass Cloudflare and Akamai challenges.
- **Proxy Rotation & Jitter:** Rotating residential proxy gateway support with dynamic jitter delays (1.2s – 3.5s).
- **Rolling 30-Day Window:** Iterates over active competitor comp-sets across **Booking.com, Agoda, and MakeMyTrip**.
- **Transactional Bulk Ingestion:** Normalizes room names and executes `insert_rate_observation()`.

### Event Intelligence Scraper (`engine/scrapers/event_scraper.py`)
- **Portals Scraped:** BookMyShow, Paytm Insider, and major Indian convention centers (**Bharat Mandapam, Yashobhoomi IICC Dwarka, Pragati Maidan**).
- **Structured LLM Extraction:** Feeds raw, noisy HTML into `GPT-4o-mini` using Pydantic schemas (`name`, `event_date`, `venue_name`, `expected_attendance`, `category`).
- **Geospatial Resolution:** Resolves precise venue coordinates for Haversine distance scoring.

---

## 3. NLP Normalization & Econometric Forecasting Core

### NLP Room-Type Normalizer (`engine/forecasting/normalization.py`)
- Employs **TF-IDF Vectorization** (word & character 1-3 ngrams) and **Cosine Similarity** (`scikit-learn`).
- Canonical Taxonomy: `Standard`, `Deluxe`, `Executive`, `Suite`.
- Automatically maps arbitrary OTA names (e.g., *"Premium Deluxe Double Sea-Facing King Bed Suite"*) to canonical categories.

### Predictive Pricing Engine (`engine/forecasting/pricing_brain.py`)
1. **Censored Demand Adjustment (Kaplan-Meier Survival Analysis):**
   - On days when the hotel reaches 100% occupancy early, observed booking demand is right-censored.
   - Fits survival curves $S(t)$ on time-until-sellout to extrapolate the unconstrained latent demand multiplier ($1 / S(t)$).
2. **Bayesian Multi-Property Modeling:**
   - Fallback empirical Bayes shrinkage for newly onboarded properties lacking booking history.
   - Shrinks property estimates toward the competitive cluster prior weighted by sample precision.
3. **XGBoost Dynamic Rate Calculator:**
   - Features: Internal occupancy, booking pace (3d pickup), competitor median rate, 48h competitor rate velocity, days to arrival, and **Geospatial Haversine Event Score**:
     $$\text{Impact} = \sum \frac{\text{Attendance}}{\text{Distance}_{\text{km}}^{1.4} + 2.5}$$
   - Predicts optimal rate bounded by strict hotelier guardrails (+/- 35% max revision).
4. **LLM Reasoning Builder:**
   - Decoupled from mathematical calculations. Takes econometric metrics and calls `GPT-4o-mini` to construct a crisp, high-conviction 1-sentence explanation to combat hotelier "algorithm aversion".

---

## 4. Next.js Stateless API Gateway & WhatsApp Copilot

- `/api/whatsapp-webhook`:
  - **Meta Verification:** GET handshake (`hub.challenge`, `hub.verify_token`).
  - **Signature Security:** HMAC-SHA256 verification using `x-hub-signature-256`.
  - **Instant Response Pattern:** Acknowledges with `200 OK` in < 50ms to satisfy Meta SLA (< 2s).
  - **Asynchronous Execution:** Detects `"Approve Rate"` button taps, calls `approve_recommendation()`, pushes ARI to Channel Manager, and sends a WhatsApp confirmation receipt back to the hotelier.
- `/api/comp-set/update`:
  - Validates session tokens, verifies property ownership under RLS, and executes `update_comp_set()`.
- `/api/rates/matrix`:
  - Supplies multi-channel rate grids and 14-day history for the analysis drawer.
- `/api/events/timeline`:
  - Returns local events with calculated Haversine distance and surge indicators (`⚡ +24% Projected Demand`).

---

## 5. Frontend UI Components

1. **`CompetitorMatrix.tsx`**:
   - Multi-channel grid (Agoda, Booking.com, MakeMyTrip).
   - **Rule-Based Color Highlights:** Red for undercutting competitors; Green for premium/higher pricing.
   - **Slide-Out Analysis Panel:** Opens 14-day Recharts price history chart and instant **"Match Competitor Rate"** action button.
2. **`EventTimeline.tsx`**:
   - Interactive local demand driver feed with attendance, venue distance, and **"Generate Pricing Suggestions"** action button.
3. **`AIActionCenter.tsx`**:
   - High-impact hero recommendation card (Current Rate vs Optimal Rate vs RevPAR Lift).
   - Comparative Recharts pace velocity chart (Current Trajectory vs Optimized Surge Curve).
   - Prominent, glowing green **"Update Rate"** button that synchronizes rates live across OTAs.

---

## Running the Codebase

### Database Migration:
```bash
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/seed.sql
```

### Next.js Application Gateway:
```bash
npm install
npm run dev
```

### Python Engine Workers:
```bash
# 1. Test Room-Type Normalizer
python engine/forecasting/normalization.py

# 2. Run Competitor Rate Scout
python engine/scout_scraper.py --days 3

# 3. Run Event Intelligence Scraper
python engine/event_scraper.py

# 4. Run Predictive Pricing Brain
python engine/pricing_brain.py --hotel-id 1
```

### Docker Compose Multi-Node Orchestration:
```bash
docker-compose up --build
```
