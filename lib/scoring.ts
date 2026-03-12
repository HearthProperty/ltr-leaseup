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

  // --- FINDING 2: Distribution (30+ sites, free) ---
  if (input.daysOnMarket > 14 || input.currentlyVacant) {
    findings.push(
      `You are likely losing 12–21 days because your unit is only being marketed on one or two platforms. To get real visibility, your listing needs to be syndicated across 30+ rental sites — Zillow, Apartments.com, Rent.com, HotPads, Zumper, Trulia, Realtor.com, Facebook Marketplace, Craigslist, and more. Most owners don't have the tools or time to do that. Hearth syndicates your listing to 30+ sites free of charge as part of our lease-up service, plus handles inquiry response, lead routing, and showing coordination so leads don't die in the inbox.`
    );
  } else {
    findings.push(
      `Even at ${input.daysOnMarket} days on market, your listing should be syndicated across 30+ rental sites to maximize exposure — not just Zillow and one or two other platforms. Hearth distributes to 30+ sites free of charge, including Zillow, Apartments.com, Rent.com, HotPads, Zumper, Trulia, Realtor.com, Facebook Marketplace, and Craigslist. But distribution alone isn't enough — most leasing delays come from slow follow-up and showing friction. You should aim for sub-5-minute inquiry response during business hours.`
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

  return findings;
}

function generateRecommendation(
  urgency: UrgencyLabel,
  property: ZillowData,
  input: FormInput
): string {
  const addr = property.address || 'Your property';
  const weeklyCost = Math.round(input.askingRent / 30) * 7;

  const plan = `Hearth's 7-day lease-up plan starts with Day 1: pricing strategy, listing optimization, and distribution across 30+ rental sites; Day 3: showing coordination, lead follow-up, and application funnel review; and Day 7: performance analysis, pricing/concession adjustments, and escalation if needed. We typically place qualified tenants within 2 weeks of engagement.`;

  switch (urgency) {
    case 'Critical':
      return `${addr} needs immediate lease-up action. Every extra week vacant is costing about $${weeklyCost.toLocaleString()}. ${plan}`;
    case 'High':
      return `${addr} needs fast lease-up action. Every extra week on market is costing about $${weeklyCost.toLocaleString()} in lost rent. ${plan}`;
    case 'Moderate':
      return `There are clear opportunities to accelerate leasing on ${addr}. Every extra week costs about $${weeklyCost.toLocaleString()}. ${plan}`;
    case 'Low':
      return `${addr} is in a reasonable position, but every week still costs about $${weeklyCost.toLocaleString()} in potential lost rent. ${plan}`;
  }
}
