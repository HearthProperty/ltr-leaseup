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
  const { dailyCost, cost30 } = costs;
  const lostSoFar = dailyCost * input.daysOnMarket;
  const lostPlusMonth = lostSoFar + cost30;

  // --- FINDING 1: Lost Rent So Far ---
  if (input.currentlyVacant) {
    findings.push(
      `${addr} has been vacant for ${input.daysOnMarket} days. At $${dailyCost.toLocaleString()}/day, you've already lost approximately $${lostSoFar.toLocaleString()} in rent. If it stays vacant another month, that number hits $${lostPlusMonth.toLocaleString()} — and that doesn't include utilities, maintenance, or insurance you're still paying on an empty unit.`
    );
  } else {
    findings.push(
      `At $${dailyCost.toLocaleString()}/day, your ${input.daysOnMarket} days on market have already cost roughly $${lostSoFar.toLocaleString()} in lost revenue. Another 30 days brings that to $${lostPlusMonth.toLocaleString()}. If your rent is even $75–$150 above market, you're losing far more in downtime than you'd save in rate.`
    );
  }

  // --- FINDING 2: Distribution (300+ sites, free) — UNCHANGED ---
  if (input.daysOnMarket > 14 || input.currentlyVacant) {
    findings.push(
      `You are likely losing 12–21 days because your unit is only being marketed on one or two platforms. To get real visibility, your listing needs to be syndicated across 300+ websites — Zillow, Apartments.com, Rent.com, HotPads, Zumper, Trulia, Realtor.com, Facebook Marketplace, Craigslist, and hundreds of local and national syndication channels. Most owners don't have the tools or time to do that. Hearth syndicates your listing to 300+ sites free of charge as part of our lease-up service, plus handles inquiry response, lead routing, and showing coordination so leads don't die in the inbox.`
    );
  } else {
    findings.push(
      `Even at ${input.daysOnMarket} days on market, your listing should be syndicated across 300+ websites to maximize exposure — not just Zillow and one or two other platforms. Hearth distributes to 300+ rental sites free of charge, including Zillow, Apartments.com, Rent.com, HotPads, Zumper, Trulia, Realtor.com, Facebook Marketplace, Craigslist, and hundreds of syndication channels. But distribution alone isn't enough — most leasing delays come from slow follow-up and showing friction. You should aim for sub-5-minute inquiry response during business hours.`
    );
  }

  // --- FINDING 3: Response Time ---
  if (input.managementSituation === 'Self-managed') {
    findings.push(
      `Most self-managing owners respond to inquiries in 6–24 hours. Hearth's leasing team picks up the phone instantly — every time. Leads contacted within minutes are 21x more likely to convert. That speed gap alone can cost you 2–3 extra weeks of vacancy.`
    );
  } else {
    findings.push(
      `Ask your PM for their average inquiry response time. If they can't tell you, that's a red flag. Leads contacted within minutes are 21x more likely to convert than leads contacted after 30 minutes. Hearth's leasing team picks up the phone instantly — every time.`
    );
  }

  // --- FINDING 4: Pre-Marketing Prep & Pricing ---
  if (input.daysOnMarket > 21) {
    findings.push(
      `Lock in your pet policy, screening criteria, and lease terms before Day 1 of marketing — most owners lose 5–10 days deciding these after applications come in. At ${input.daysOnMarket} days, you should also review pricing. A $75–$100/mo rate cut costs $900–$1,200/year but could save you $${cost30.toLocaleString()} in vacancy. Hearth handles all of this during onboarding.`
    );
  } else {
    findings.push(
      `Lock in your pet policy, screening criteria, and lease terms before you start marketing. Most owners lose 5–10 days deciding these after applications come in. Hearth's onboarding eliminates this delay — every decision is made upfront so your listing goes live ready to close.`
    );
  }

  return findings;
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
