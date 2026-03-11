// Discord notification — fire-and-forget.
// If this fails, we log the error but never block the lead submission.

import { config } from './config';
import type { FormInput, ZillowData, ScoreResult } from './types';

export async function sendLeadNotification(
  input: FormInput,
  property: ZillowData,
  score: ScoreResult,
  resultUrl: string
): Promise<boolean> {
  try {
    const addressStr = property.address || 'See Zillow link';
    const cityStr = property.city && property.state
      ? `${property.city}, ${property.state}`
      : 'See listing';

    // Build fields — Discord rejects empty string values
    const fields: Array<{ name: string; value: string; inline: boolean }> = [
      { name: 'Lead Magnet', value: 'Lease-Up Audit', inline: true },
      { name: 'Owner', value: input.ownerName || 'N/A', inline: true },
      { name: 'Urgency', value: `${score.urgencyScore}/10 — ${score.urgencyLabel}`, inline: true },
      { name: 'Phone', value: input.phone || 'N/A', inline: true },
      { name: 'Email', value: input.email || 'N/A', inline: true },
      { name: 'Property', value: addressStr, inline: false },
      { name: 'City', value: cityStr, inline: true },
      { name: 'Asking Rent', value: `$${input.askingRent.toLocaleString()}/mo`, inline: true },
      { name: 'Days on Market', value: `${input.daysOnMarket}`, inline: true },
    ];

    if (property.bedrooms) {
      fields.push({
        name: 'Details',
        value: `${property.bedrooms}bd/${property.bathrooms || '?'}ba${property.sqft ? ` · ${property.sqft.toLocaleString()} sqft` : ''}`,
        inline: true,
      });
    }

    fields.push(
      { name: 'Zillow', value: input.zillowUrl, inline: false },
      { name: 'Summary', value: (score.recommendation || 'See results').slice(0, 1024), inline: false },
      { name: 'Results', value: resultUrl, inline: false },
    );

    const embed = {
      title: '🏠 New Lease-Up Lead',
      color: 16750848,
      fields,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(config.discord.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Discord] Webhook failed:', response.status, errorText);
      return false;
    }

    console.log('[Discord] Lead notification sent successfully');
    return true;
  } catch (error) {
    console.error('[Discord] Webhook error:', error);
    return false;
  }
}
