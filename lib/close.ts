// Close CRM integration — creates a lead via POST /api/v1/lead/
// Skips entirely if credentials aren't configured.

import type { FormInput, ZillowData, ScoreResult } from './types';

interface CloseLeadResponse {
  id: string;
  [key: string]: unknown;
}

function getCloseConfig() {
  const apiKey = process.env.CLOSE_API_KEY;
  const leadStatusId = process.env.CLOSE_LEAD_STATUS_ID;
  const cfPropertyAddress = process.env.CLOSE_CF_PROPERTY_ADDRESS;
  const cfAskingRent = process.env.CLOSE_CF_ASKING_RENT;
  const cfDaysOnMarket = process.env.CLOSE_CF_DAYS_ON_MARKET;
  const cfUrgencyScore = process.env.CLOSE_CF_URGENCY_SCORE;
  const cfAuditSummary = process.env.CLOSE_CF_AUDIT_SUMMARY;
  const cfLeadSource = process.env.CLOSE_CF_LEAD_SOURCE;

  if (!apiKey || !leadStatusId) {
    return null; // Not configured — skip
  }

  return {
    apiKey,
    leadStatusId,
    cf: {
      propertyAddress: cfPropertyAddress,
      askingRent: cfAskingRent,
      daysOnMarket: cfDaysOnMarket,
      urgencyScore: cfUrgencyScore,
      auditSummary: cfAuditSummary,
      leadSource: cfLeadSource,
    },
  };
}

export async function createLead(
  input: FormInput,
  property: ZillowData,
  score: ScoreResult
): Promise<string | undefined> {
  const closeConfig = getCloseConfig();

  if (!closeConfig) {
    console.log('[Close CRM] Skipped — credentials not configured');
    return undefined;
  }

  const addressStr = property.address
    ? `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}`
    : input.zillowUrl;

  const customFields: Record<string, unknown> = {};
  if (closeConfig.cf.propertyAddress) customFields[`custom.${closeConfig.cf.propertyAddress}`] = addressStr;
  if (closeConfig.cf.askingRent) customFields[`custom.${closeConfig.cf.askingRent}`] = input.askingRent;
  if (closeConfig.cf.daysOnMarket) customFields[`custom.${closeConfig.cf.daysOnMarket}`] = input.daysOnMarket;
  if (closeConfig.cf.urgencyScore) customFields[`custom.${closeConfig.cf.urgencyScore}`] = `${score.urgencyScore}/10 — ${score.urgencyLabel}`;
  if (closeConfig.cf.auditSummary) customFields[`custom.${closeConfig.cf.auditSummary}`] = score.recommendation;
  if (closeConfig.cf.leadSource) customFields[`custom.${closeConfig.cf.leadSource}`] = 'Lease-Up Audit';

  const payload = {
    name: `Lease-Up Lead: ${input.ownerName} — ${addressStr}`,
    status_id: closeConfig.leadStatusId,
    contacts: [
      {
        name: input.ownerName,
        emails: [{ type: 'office', email: input.email }],
        phones: [{ type: 'mobile', phone: input.phone }],
      },
    ],
    ...customFields,
  };

  const credentials = Buffer.from(`${closeConfig.apiKey}:`).toString('base64');

  const response = await fetch('https://api.close.com/api/v1/lead/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Close CRM] Failed to create lead:', response.status, errorText);
    throw new Error(`Close CRM error: ${response.status}`);
  }

  const data = (await response.json()) as CloseLeadResponse;
  console.log('[Close CRM] Lead created:', data.id);
  return data.id;
}
