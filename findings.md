# Findings — LTR Lease-Up

## Close CRM API (researched 2026-03-10)

- **Create Lead:** `POST https://api.close.com/api/v1/lead/`
- **Auth:** Basic auth, API key as username, empty password → Base64 encode `{key}:`
- **Contacts:** Nest `contacts[]` inside lead payload with `name`, `emails[]`, `phones[]`
- **Custom fields:** Use `custom.{FIELD_ID}` syntax (not the deprecated `custom.{FIELD_NAME}`)
- **Status:** Use `status_id` (not `status` label) — users can rename without breaking integration
- Activities, tasks, opportunities must be posted separately (not needed for v1)

## Discord Webhooks (researched 2026-03-10)

- **Endpoint:** `POST {webhook_url}`
- **Payload:** `{ "embeds": [{ ... }] }` — up to 10 embeds per message
- **Embed limits:** title 256 chars, description 2048 chars, field name 256 chars, field value 1024 chars, total 6000 chars, max 25 fields
- **Inline fields:** Set `inline: true` to render up to 3 per row
- **Color:** Integer (decimal representation of hex color)

## Architecture Decision

- Next.js 14 App Router with TypeScript — aligns with Vercel deployment target
- Vanilla CSS over Tailwind — full design control for premium aesthetic
- No database in v1 — Close CRM is the system of record
- Scoring logic hardcoded in config — no external dependencies
