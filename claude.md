# Project Constitution — LTR Lease-Up Inbound Funnel

> This file is **law**. All data schemas, behavioral rules, and architectural invariants live here.

---

## North Star

Capture high-intent LTR owners with vacant or slow-leasing properties, instantly generate a credible lease-up audit, push qualified leads into Close CRM, and notify the Hearth team in Discord so follow-up happens fast.

Turn `leaseup.hearthproperty.com` into a focused inbound funnel for owners asking: *"Why isn't my rental leasing, what is that costing me, and can Hearth fix it fast?"*

---

## Integrations

### Required
- **Close CRM** — lead creation/update (source of truth for lead records)
- **Discord** — internal lead notifications (not source of record)
- **Vercel** — hosting + serverless API routes
- **Squarespace DNS** — subdomain CNAME for `leaseup.hearthproperty.com`
- **GitHub** — repo + deploy workflow

### Optional (v1.1+)
- PDF generation library for downloadable audit output
- Analytics (PostHog, GA4, or simple custom event logging)

### Not Needed for v1
AppFolio, Slack, Google Sheets, property management software

### Credentials Required Before Build
- `CLOSE_API_KEY`
- `CLOSE_LEAD_STATUS_ID` — status for new inbound leads
- `CLOSE_CF_PROPERTY_ADDRESS` — custom field ID
- `CLOSE_CF_ASKING_RENT` — custom field ID
- `CLOSE_CF_DAYS_ON_MARKET` — custom field ID
- `CLOSE_CF_URGENCY_SCORE` — custom field ID
- `CLOSE_CF_AUDIT_SUMMARY` — custom field ID
- `CLOSE_CF_LEAD_SOURCE` — custom field ID
- `DISCORD_WEBHOOK_URL` — webhook for target channel
- `NEXT_PUBLIC_SITE_URL` — `https://leaseup.hearthproperty.com`

---

## Source of Truth

| Data | Owner |
|------|-------|
| Lead/contact metadata | Close CRM |
| Notification stream | Discord |
| Form submission payload | In-memory / server-side request |
| Scoring logic / rules | Hardcoded config in codebase |
| Result rendering | Generated on the fly from submitted inputs |

No standalone database in v1.

---

## Delivery Payload

### To the Prospect
- Immediate browser results page on `leaseup.hearthproperty.com`
- Optional downloadable PDF audit (v1.1)
- Strong CTA to book a call or start onboarding

### To Hearth in Close CRM
- Lead pushed with summary, score, and qualifiers

### To Hearth in Discord
- New lead notification with: lead magnet name, owner name, phone, email, property address, city, asking rent, days on market, urgency/score, summary, result URL, CTA links if available

---

## Data Schema

### Form Input (client → server)

```json
{
  "ownerName": "string",
  "email": "string",
  "phone": "string",
  "propertyAddress": "string",
  "city": "string",
  "state": "string (2-letter)",
  "propertyType": "SFR | Duplex | Triplex | Fourplex | Condo/Townhome",
  "bedrooms": "number",
  "bathrooms": "number",
  "askingRent": "number",
  "daysOnMarket": "number",
  "currentlyVacant": "boolean",
  "managementSituation": "Self-managed | Have a PM | No PM yet"
}
```

### Scoring Output

```json
{
  "urgencyScore": "number (1-10)",
  "urgencyLabel": "Critical | High | Moderate | Low",
  "estimatedMonthlyLoss": "number",
  "estimatedAnnualLoss": "number",
  "findings": ["string (3-5 bullets)"],
  "recommendation": "string"
}
```

### Close CRM Lead Payload (`POST /api/v1/lead/`)

```json
{
  "name": "Lease-Up Lead: {ownerName} — {propertyAddress}",
  "status_id": "env:CLOSE_LEAD_STATUS_ID",
  "contacts": [{
    "name": "{ownerName}",
    "emails": [{ "type": "office", "email": "{email}" }],
    "phones": [{ "type": "mobile", "phone": "{phone}" }]
  }],
  "custom.{CF_ID}": "values mapped by env var field IDs"
}
```

Custom field env vars: `CLOSE_CF_PROPERTY_ADDRESS`, `CLOSE_CF_ASKING_RENT`, `CLOSE_CF_DAYS_ON_MARKET`, `CLOSE_CF_URGENCY_SCORE`, `CLOSE_CF_AUDIT_SUMMARY`, `CLOSE_CF_LEAD_SOURCE`

### Discord Webhook Embed

Embed fields: Lead Magnet, Owner, Phone, Email, Property, City, Asking Rent, Days on Market, Urgency Score, Summary, Result URL.

---

## Behavioral Rules

- **Tone:** Direct, premium, operational, trustworthy
- **Copy:** Emphasize hands-free service, not "software features"
- **Result feel:** Mini consulting deliverable
- **Form:** Short, high-conversion, minimum fields
- **Speed over features** in v1
- **Assume** the owner wants the problem solved, not endless education
- **Strong CTA on every result page:** Book a Call or Start Onboarding
- **If scoring is used:** Highlight urgency, not false precision

### Logic Constraints

- Only collect the minimum fields needed to qualify and route the lead
- Always create a useful summary from the inputs
- Always send email + phone to Close if provided
- Always send a Discord notification after successful submission to Close
- Show an immediate result, even if lightweight
- Discord notifications should be concise, readable, and action-oriented

### Do Not

- Do not make it look like a generic landlord calculator
- Do not make it feel playful or gimmicky
- Do not require login/account creation
- Do not make Close submission dependent on client-side JS only
- Do not make Discord the source of truth
- Do not add unnecessary integrations
- Do not overbuild dedupe/database logic in v1
- Do not position Hearth as software

---

## Architectural Invariants

- **Stack:** Next.js 14 App Router · TypeScript · Vanilla CSS · Vercel Serverless
- All business logic is deterministic (no LLM in critical path)
- All tools in `lib/` are atomic, testable functions
- Environment variables in `.env.local` (never hard-coded)
- Temporary files in `.tmp/` — ephemeral only
- SOPs in `architecture/` are updated **before** code changes
- Close CRM is the critical path — if Close fails, the submission fails
- Discord is fire-and-forget — if Discord fails, log but do not block
- All actions happen synchronously on form submit (no cron, no queues, no scheduled jobs)
- Project is only "complete" when payload reaches Close + Discord + results page

---

## Maintenance Log

| Date | Entry |
|------|-------|
| 2026-03-10 | Project initialized. Discovery complete. Blueprint drafted. |
| 2026-03-11 | Full Blueprint spec finalized by user. Constitution updated with integrations, source of truth, delivery payload, and expanded behavioral rules. |
