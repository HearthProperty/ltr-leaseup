# Lease-Up Audit — Hearth Property

A free lead magnet tool that gives rental property owners an instant vacancy analysis, leasing urgency score, and professional recommendation. Built to capture leads for Hearth Property's lease-up services.

**Live:** [leaseup.hearthproperty.com](https://leaseup.hearthproperty.com)

---

## How It Works

1. Owner pastes their **Zillow listing URL** and fills out a short form (name, email, phone, asking rent, days on market)
2. Backend **scrapes listing data** from Zillow (beds, baths, sqft, Zestimate, photos)
3. A **scoring engine** calculates a 1–10 urgency score with findings and a recommendation
4. Results are displayed instantly in a polished audit report
5. Lead data is sent to **Close CRM** + a **Discord notification** fires — all in parallel and non-blocking

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Vanilla CSS (glassmorphism, gradients, animations) |
| Validation | Zod |
| CRM | Close API |
| Notifications | Discord Webhooks |
| Analytics | Vercel Analytics |
| Hosting | Vercel |

## Project Structure

```
app/
├── page.tsx                    # Landing page (hero, trust signals, form)
├── layout.tsx                  # Root layout, metadata, analytics
├── globals.css                 # Full design system
├── components/
│   ├── LeaseUpForm.tsx         # Multi-section form with validation
│   ├── ResultCard.tsx          # Individual finding card
│   └── ScoreGauge.tsx          # Animated urgency score gauge
├── results/
│   └── page.tsx                # Audit results page
└── api/
    └── submit/
        └── route.ts            # POST handler: validate → scrape → score → CRM + Discord

lib/
├── types.ts                    # Zod schemas & TypeScript interfaces
├── config.ts                   # Environment config
├── zillow.ts                   # Zillow scraper
├── scoring.ts                  # Urgency scoring engine
├── scoring-rules.ts            # Scoring rule definitions
├── close.ts                    # Close CRM lead creation
└── discord.ts                  # Discord webhook notifications
```

## Environment Variables

Create a `.env.local` file with:

```env
CLOSE_API_KEY=...               # Close CRM API key
CLOSE_STATUS_ID=...             # Close lead status ID
DISCORD_WEBHOOK_URL=...         # Discord channel webhook
NEXT_PUBLIC_SITE_URL=...        # Deployed site URL (e.g. https://leaseup.hearthproperty.com)
```

## Getting Started

```bash
# Install dependencies
npm install

# Pull env vars from Vercel (if linked)
vercel env pull

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deployed on Vercel with a two-branch workflow:

| Branch | Environment | Domain |
|--------|-------------|--------|
| `staging` | Preview | Auto-generated Vercel preview URL |
| `main` | Production | `leaseup.hearthproperty.com` |

```bash
# Push to preview
git checkout staging
git add -A; git commit -m "your changes"; git push

# Promote to production
git checkout main
git merge staging
git push
```

## Submission Flow

```
User submits form
    → Zod validation
    → Scrape Zillow listing
    → Calculate urgency score (1–10)
    → Fire in parallel:
        ├── Create lead in Close CRM
        └── Send Discord notification
    → Return score + findings + recommendation
    → Client stores in sessionStorage → redirect to /results
```

---

Built by [Hearth Property](https://hearthproperty.com) — Hands-free property management for serious owners.