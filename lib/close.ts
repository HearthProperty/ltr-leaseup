// Close CRM integration — creates a lead via POST /api/v1/lead/
// Critical path: if this fails, the entire submission fails.

import { config } from './config';
import type { FormInput, ZillowData, ScoreResult } from './types';

interface CloseLeadResponse {
  id: string;
  [key: string]: unknown;
}

export async function createLead(
  input: FormInput,
  property: ZillowData,
  score: ScoreResult
): Promise<string> {
  const { close } = config;

  const addressStr = property.address
    ? `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}`
    : input.zillowUrl;

  const payload = {
    name: `Lease-Up Lead: ${input.ownerName} — ${addressStr}`,
    status_id: close.leadStatusId,
    contacts: [
      {
        name: input.ownerName,
        emails: [{ type: 'office', email: input.email }],
        phones: [{ type: 'mobile', phone: input.phone }],
      },
    ],
    [`custom.${close.cf.propertyAddress}`]: addressStr,
    [`custom.${close.cf.askingRent}`]: input.askingRent,
    [`custom.${close.cf.daysOnMarket}`]: input.daysOnMarket,
    [`custom.${close.cf.urgencyScore}`]: `${score.urgencyScore}/10 — ${score.urgencyLabel}`,
    [`custom.${close.cf.auditSummary}`]: score.recommendation,
    [`custom.${close.cf.leadSource}`]: 'Lease-Up Audit',
  };

  const credentials = Buffer.from(`${close.apiKey}:`).toString('base64');

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
    throw new Error(`Close CRM error: ${response.status} — ${errorText}`);
  }

  const data = (await response.json()) as CloseLeadResponse;
  console.log('[Close CRM] Lead created:', data.id);
  return data.id;
}
