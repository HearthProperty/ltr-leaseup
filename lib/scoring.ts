// Scoring engine — pure, deterministic, no external calls.
// Generates concrete, actionable findings with financial context.

import type { FormInput, ZillowData, ScoreResult, UrgencyLabel } from './types';
import {
  DOM_THRESHOLDS,
  VACANCY_BONUS,
  VACANCY_COST_FACTOR,
  MANAGEMENT_MODIFIER,
  URGENCY_LABELS,
} from './scoring-rules';

export function calculateScore(input: FormInput, property: ZillowData): ScoreResult {
  // 1. Base score from days on market
  let baseScore = 1;
  for (const t of DOM_THRESHOLDS) {
    if (input.daysOnMarket <= t.max) {
      baseScore = t.score;
      break;
    }
  }

  // 2. Vacancy bonus
  if (input.currentlyVacant) {
    baseScore += VACANCY_BONUS;
  }

  // 3. Management situation modifier
  baseScore += MANAGEMENT_MODIFIER[input.managementSituation];

  // 4. Clamp to 1–10
  const urgencyScore = Math.max(1, Math.min(10, baseScore));

  // 5. Urgency label
  let urgencyLabel: UrgencyLabel = 'Low';
  for (const u of URGENCY_LABELS) {
    if (urgencyScore <= u.max) {
      urgencyLabel = u.label;
      break;
    }
  }

  // 6. Vacancy cost math
  const dailyCost = Math.round(input.askingRent / 30);
  const cost7 = dailyCost * 7;
  const cost14 = dailyCost * 14;
  const cost30 = dailyCost * 30;
  const vacancyFactor = input.currentlyVacant ? VACANCY_COST_FACTOR : 0.5;
  const estimatedMonthlyLoss = Math.round(input.askingRent * vacancyFactor);
  const estimatedAnnualLoss = estimatedMonthlyLoss * 12;

  // 7. Generate findings
  const findings = generateFindings(input, property, { dailyCost, cost7, cost14, cost30 });

  // 8. Recommendation
  const recommendation = generateRecommendation(urgencyLabel, property, input);

  return {
    urgencyScore,
    urgencyLabel,
    estimatedMonthlyLoss,
    estimatedAnnualLoss,
    findings,
    recommendation,
  };
}

interface CostCalc {
  dailyCost: number;
  cost7: number;
  cost14: number;
  cost30: number;
}

function generateFindings(
  input: FormInput,
  property: ZillowData,
  costs: CostCalc
): string[] {
  const findings: string[] = [];
  const addr = property.address || 'Your property';
  const { dailyCost, cost7, cost14, cost30 } = costs;

  // --- FINDING 1: Vacancy Cost Calculator ---
  if (input.currentlyVacant) {
    findings.push(
      `${addr} is vacant right now. At your asking rent of $${input.askingRent.toLocaleString()}/mo, every 7 vacant days costs you $${cost7.toLocaleString()} in lost gross rent. At 14 days, that's $${cost14.toLocaleString()}. At 30 days, you've lost $${cost30.toLocaleString()} — and that doesn't include utilities, maintenance, or insurance you're still paying on an empty unit. The fastest way to stop the bleed is a structured lease-up plan with aggressive distribution and same-day inquiry response.`
    );
  } else {
    findings.push(
      `At your asking rent of $${input.askingRent.toLocaleString()}/mo, every extra 7 days on market costs roughly $${cost7.toLocaleString()} in lost revenue. At 14 days, that's $${cost14.toLocaleString()}. If your rent is high by even $75–$150 relative to market, you may be losing far more in downtime than you gain in rate. Hearth would run a 14-day lease-up plan with price testing, listing distribution, follow-up speed, and showing coordination.`
    );
  }

  // --- FINDING 2: Distribution & Follow-Up ---
  if (input.daysOnMarket > 14 || input.currentlyVacant) {
    findings.push(
      `You are likely losing 12–21 days because your unit is only being marketed on one or two platforms. To get real visibility, your listing needs to be syndicated across 300+ websites — Zillow, Apartments.com, Rent.com, HotPads, Zumper, Trulia, Realtor.com, Facebook Marketplace, Craigslist, and hundreds of local and national syndication channels. Most owners don't have the tools or time to do that. Hearth syndicates your listing to 300+ sites free of charge as part of our lease-up service, plus handles inquiry response, lead routing, and showing coordination so leads don't die in the inbox.`
    );
  } else {
    findings.push(
      `Even at ${input.daysOnMarket} days on market, your listing should be syndicated across 300+ websites to maximize exposure — not just Zillow and one or two other platforms. Hearth distributes to 300+ rental sites free of charge, including Zillow, Apartments.com, Rent.com, HotPads, Zumper, Trulia, Realtor.com, Facebook Marketplace, Craigslist, and hundreds of syndication channels. But distribution alone isn't enough — most leasing delays come from slow follow-up and showing friction. You should aim for sub-5-minute inquiry response during business hours.`
    );
  }

  // --- FINDING 3: Response Time & Showing Friction ---
  if (input.managementSituation === 'Self-managed') {
    findings.push(
      `If you are self-managing, slow follow-up is likely costing you more than small pricing adjustments. You should have a same-day inquiry response standard and a structured showing workflow — otherwise, ad spend and syndication volume gets wasted. Most self-managing owners respond in 6–24 hours. Top-performing property managers respond in under 5 minutes. That gap alone can cost you 2–3 weeks of vacancy.`
    );
  } else {
    findings.push(
      `Even with a PM in place, you should verify their average inquiry response time. Industry data shows that leads contacted within 5 minutes are 21x more likely to convert than leads contacted after 30 minutes. If your PM is averaging 2–4 hour response times, that's likely costing you 1–2 extra weeks of vacancy per turnover. Ask for their response time metrics — if they can't provide them, that's a red flag.`
    );
  }

  // --- FINDING 4: Pre-Marketing Checklist ---
  findings.push(
    `You should pre-decide pet policy, minimum screening standards, and approval thresholds before marketing. Most owners lose 5–10 days by making these decisions after receiving applications. Have your lease terms, move-in costs, and screening criteria locked in before Day 1 of marketing. Hearth's standard onboarding includes a pre-marketing checklist that eliminates this delay entirely.`
  );

  // --- FINDING 5: Pricing Friction ---
  if (input.daysOnMarket > 21) {
    findings.push(
      `At ${input.daysOnMarket} days on market, pricing friction is likely a factor. Every extra week at the wrong price costs you $${cost7.toLocaleString()} in lost rent — far more than a $50–$100/mo rate adjustment would cost over a 12-month lease ($600–$1,200 total). Hearth recommends reviewing pricing at Day 10 and making a decision by Day 14: adjust rate, add concessions, or change positioning. Waiting past Day 21 to adjust almost always costs more than the adjustment itself.`
    );
  }

  return findings.slice(0, 5);
}

function generateRecommendation(
  urgency: UrgencyLabel,
  property: ZillowData,
  input: FormInput
): string {
  const addr = property.address || 'your property';
  const dailyCost = Math.round(input.askingRent / 30);

  switch (urgency) {
    case 'Critical':
      return `${addr} needs immediate leasing intervention. At $${dailyCost}/day in lost rent, every week of delay costs you $${(dailyCost * 7).toLocaleString()}. Hearth's 14-day lease-up plan includes: Day 1 pricing finalization, Day 2 listing refresh with professional photos, Day 3 broad distribution across 10+ channels, Days 4–7 sub-5-minute inquiry response and showing coordination, Day 7 lead quality review, Day 10 pricing adjustment if needed, and Day 14 escalation. We typically place a qualified tenant within 2–3 weeks of engagement.`;
    case 'High':
      return `Your property is showing strong indicators of a leasing problem that will compound. At $${dailyCost}/day, waiting another two weeks to act costs $${(dailyCost * 14).toLocaleString()}. Hearth would immediately audit your pricing, refresh your listing, push broad distribution, and implement same-day showing coordination. We recommend scheduling a strategy call this week — the cost of delay is real and measurable.`;
    case 'Moderate':
      return `There are clear opportunities to accelerate leasing on ${addr}. A structured approach — correct pricing, broad distribution, fast follow-up, and showing coordination — can cut your time-to-tenant by 1–3 weeks. At $${dailyCost}/day, even shaving 10 days off your vacancy saves $${(dailyCost * 10).toLocaleString()}. Hearth's team can identify the fastest path to a signed lease.`;
    case 'Low':
      return `${addr} is in a reasonable position, but there may still be ways to lease faster or at a better rate. Even at low urgency, having a pre-marketing checklist, broad distribution, and fast inquiry response can shave days off your vacancy. At $${dailyCost}/day, every day matters. Hearth's team can review your approach and suggest specific optimizations.`;
  }
}
