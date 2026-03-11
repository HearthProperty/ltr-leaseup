# Scoring Logic SOP

## Overview

The scoring engine (`lib/scoring.ts`) calculates a **deterministic urgency score** from form inputs. No external APIs, no LLMs — all rules are hardcoded in `lib/scoring-rules.ts`.

## Score Calculation

### Input Factors

1. **Days on Market** (heaviest weight)
   - 0–7 days → score 1
   - 8–14 days → score 2
   - 15–21 days → score 4
   - 22–30 days → score 5
   - 31–45 days → score 7
   - 46–60 days → score 8
   - 61–90 days → score 9
   - 90+ days → score 10

2. **Currently Vacant** → +2 to base score

3. **Management Situation**
   - Self-managed → +1
   - Have a PM → −1
   - No PM yet → +2

### Clamping
Final score is clamped to **1–10**.

### Urgency Labels
- 1–3 → **Low**
- 4–5 → **Moderate**
- 6–7 → **High**
- 8–10 → **Critical**

## Vacancy Cost Estimation

```
estimatedMonthlyLoss = askingRent × vacancyFactor × units
estimatedAnnualLoss = estimatedMonthlyLoss × 12
```

- `vacancyFactor` = 1.0 if vacant, 0.5 if not
- `units` = 1 (SFR/Condo), 2 (Duplex), 3 (Triplex), 4 (Fourplex)

## Findings Generation

3–5 bullets generated from:
1. Vacancy status observation
2. Days on market assessment
3. Cost quantification
4. Management situation insight
5. Rent/listing positioning (if DOM > 30)

## Recommendation

One sentence tailored to urgency level, referencing the specific property and Hearth's services.

## Tuning

All thresholds and weights live in `lib/scoring-rules.ts`. To adjust scoring behavior, modify that file only — the scoring engine in `lib/scoring.ts` reads from it.
