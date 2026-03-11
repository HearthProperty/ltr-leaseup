// Centralized config — reads env vars and exports typed constants.
// Throws at startup if required server-side vars are missing.

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Server-only config (not exposed to client)
export const config = {
  close: {
    apiKey: requireEnv('CLOSE_API_KEY'),
    leadStatusId: requireEnv('CLOSE_LEAD_STATUS_ID'),
    cf: {
      propertyAddress: requireEnv('CLOSE_CF_PROPERTY_ADDRESS'),
      askingRent: requireEnv('CLOSE_CF_ASKING_RENT'),
      daysOnMarket: requireEnv('CLOSE_CF_DAYS_ON_MARKET'),
      urgencyScore: requireEnv('CLOSE_CF_URGENCY_SCORE'),
      auditSummary: requireEnv('CLOSE_CF_AUDIT_SUMMARY'),
      leadSource: requireEnv('CLOSE_CF_LEAD_SOURCE'),
    },
  },
  discord: {
    webhookUrl: requireEnv('DISCORD_WEBHOOK_URL'),
  },
  site: {
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://leaseup.hearthproperty.com',
  },
} as const;
