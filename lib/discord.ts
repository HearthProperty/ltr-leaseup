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
    const addressStr = property.address
      ? `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}`
      : 'See Zillow link';

    const embed = {
      title: '🏠 New Lease-Up Lead',
      color: 16750848, // gold/amber
      fields: [
        { name: 'Lead Magnet', value: 'Lease-Up Audit', inline: true },
        { name: 'Owner', value: input.ownerName, inline: true },
        { name: 'Urgency', value: `${score.urgencyScore}/10 — ${score.urgencyLabel}`, inline: true },
        { name: 'Phone', value: input.phone, inline: true },
        { name: 'Email', value: input.email, inline: true },
        { name: 'Property', value: addressStr, inline: false },
        { name: 'City', value: property.city && property.state ? `${property.city}, ${property.state}` : 'See listing', inline: true },
        { name: 'Asking Rent', value: `$${input.askingRent.toLocaleString()}/mo`, inline: true },
        { name: 'Days on Market', value: `${input.daysOnMarket}`, inline: true },
        ...(property.bedrooms ? [{ name: 'Details', value: `${property.bedrooms}bd/${property.bathrooms || '?'}ba${property.sqft ? ` · ${property.sqft.toLocaleString()} sqft` : ''}`, inline: true }] : []),
        { name: 'Zillow Listing', value: input.zillowUrl, inline: false },
        { name: 'Summary', value: score.recommendation, inline: false },
        { name: 'Result URL', value: resultUrl, inline: false },
      ],
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
