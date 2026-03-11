# Submission Flow SOP

## Overview

When a user submits the lease-up audit form, the following flow executes **synchronously** on the server:

```
Form Submit → POST /api/submit → Validate → Score → Close CRM → Discord → Respond
```

## Step-by-Step

### 1. Client-side Form Submit
- `LeaseUpForm.tsx` collects all fields and sends `POST /api/submit` with JSON body
- Loading state shown during submission

### 2. Server-side Validation
- `app/api/submit/route.ts` parses request body
- Validates against Zod schema (`formInputSchema`)
- Returns 400 with field errors if validation fails

### 3. Scoring
- Calls `calculateScore(input)` from `lib/scoring.ts`
- Pure, deterministic — no external calls
- Returns urgency score, vacancy cost, findings, recommendation

### 4. Close CRM (Critical Path)
- Calls `createLead(input, score)` from `lib/close.ts`
- `POST https://api.close.com/api/v1/lead/` with Basic auth
- **If Close fails → return 500 to client** (lead is the critical path)

### 5. Discord Notification (Fire-and-Forget)
- Calls `sendLeadNotification(input, score, resultUrl)` from `lib/discord.ts`
- `POST {DISCORD_WEBHOOK_URL}` with embed payload
- **If Discord fails → log error, continue** (never block the submission)

### 6. Response
- Returns JSON with `{ success, score, closeLeadId, resultUrl }`
- Client redirects to `/results?data={base64EncodedPayload}`

## Error Handling

| Failure Point | Behavior |
|---------------|----------|
| Validation | 400 with field-level errors |
| Close CRM | 500 — blocks submission |
| Discord | Logged — does not block |
| Unexpected | 500 with generic message |
