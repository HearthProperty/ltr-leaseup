// Scoring engine — pure, deterministic, no external calls.
// Calculates urgency score, vacancy cost, findings, and recommendation.

import type { FormInput, ZillowData, ScoreResult, UrgencyLabel } from './types';
import {
  DOM_THRESHOLDS,
  VACANCY_BONUS,
  VACANCY_COST_FACTOR,
  MANAGEMENT_MODIFIER,
  URGENCY_LABELS,
} from './scoring-rules';

export function calculateScore(input: FormInput, property: ZillowData): ScoreResult {
  // 1. Base score from days on market (heaviest factor)
  let baseScore = 1;
  let domInsight = '';
  for (const t of DOM_THRESHOLDS) {
    if (input.daysOnMarket <= t.max) {
      baseScore = t.score;
      domInsight = t.label;
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

  // 6. Estimated vacancy cost
  const vacancyFactor = input.currentlyVacant ? VACANCY_COST_FACTOR : 0.5;
  const estimatedMonthlyLoss = Math.round(input.askingRent * vacancyFactor);
  const estimatedAnnualLoss = estimatedMonthlyLoss * 12;

  // 7. Generate findings (3–5 bullets)
  const findings: string[] = [];
  const propertyLabel = property.address || 'Your property';

  // Vacancy finding
  if (input.currentlyVacant) {
    findings.push(
      `${propertyLabel} is currently vacant — every day without a tenant costs you approximately $${Math.round(input.askingRent / 30)}/day in lost revenue.`
    );
  } else {
    findings.push(
      `${propertyLabel} has been listed for ${input.daysOnMarket} days. ${domInsight}.`
    );
  }

  // Days on market finding
  if (input.daysOnMarket > 21) {
    findings.push(
      `At ${input.daysOnMarket} days on market, your property is outside the optimal leasing window. The longer it sits, the harder it becomes to attract quality tenants.`
    );
  } else if (input.daysOnMarket > 7) {
    findings.push(
      `${input.daysOnMarket} days on market is within the normal range, but there are steps to accelerate leasing.`
    );
  }

  // Cost finding
  findings.push(
    `Estimated vacancy cost: $${estimatedMonthlyLoss.toLocaleString()}/month ($${estimatedAnnualLoss.toLocaleString()}/year) based on your asking rent of $${input.askingRent.toLocaleString()}/mo.`
  );

  // Property-specific finding from Zillow data
  if (property.raw && property.bedrooms && property.sqft) {
    findings.push(
      `Based on your Zillow listing, this ${property.bedrooms}bd/${property.bathrooms || '?'}ba ${property.propertyType !== 'Unknown' ? property.propertyType : 'property'} (${property.sqft.toLocaleString()} sq ft) should be competitive in ${property.city || 'your market'} — if it's sitting, the issue is likely pricing, photos, or marketing reach.`
    );
  }

  // Management finding
  if (input.managementSituation === 'Self-managed') {
    findings.push(
      'Self-managing during a vacancy often means slower turnaround — professional leasing support can cut your time-to-tenant significantly.'
    );
  } else {
    findings.push(
      'Having a PM is a good start, but if leasing is stalling, it may be time to evaluate their marketing and pricing strategy.'
    );
  }

  // Rent positioning finding
  if (input.daysOnMarket > 30 && input.askingRent > 0) {
    findings.push(
      'Properties that sit beyond 30 days often benefit from a pricing adjustment or enhanced listing presentation — even small changes can dramatically increase showing activity.'
    );
  }

  // Cap at 5 findings
  const cappedFindings = findings.slice(0, 5);

  // 8. Recommendation
  const recommendation = generateRecommendation(urgencyLabel, property);

  return {
    urgencyScore,
    urgencyLabel,
    estimatedMonthlyLoss,
    estimatedAnnualLoss,
    findings: cappedFindings,
    recommendation,
  };
}

function generateRecommendation(urgency: UrgencyLabel, property: ZillowData): string {
  const propRef = property.address ? `your property at ${property.address}` : 'your property';

  switch (urgency) {
    case 'Critical':
      return `${propRef} needs immediate leasing intervention. Hearth can typically place a qualified tenant within 2–3 weeks of engagement — every day of delay is costing you real money.`;
    case 'High':
      return `Your property is showing strong indicators of a leasing problem that will get worse without action. Hearth's lease-up team can diagnose and fix the issue fast — we recommend scheduling a strategy call this week.`;
    case 'Moderate':
      return `There are clear opportunities to accelerate leasing on your property. A quick strategy session with Hearth's team can identify the fastest path to a signed lease.`;
    case 'Low':
      return `Your property is in a reasonable position, but there may still be ways to lease faster or at a better rate. Hearth's team can review your approach and suggest optimizations.`;
  }
}
