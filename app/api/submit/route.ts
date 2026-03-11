// API route: POST /api/submit
// Orchestrates: validate → scrape Zillow → score → Close + Discord (parallel) → respond

import { NextResponse } from 'next/server';
import { formInputSchema } from '@/lib/types';
import { scrapeZillowListing } from '@/lib/zillow';
import { calculateScore } from '@/lib/scoring';
import { createLead } from '@/lib/close';
import { sendLeadNotification } from '@/lib/discord';

export async function POST(request: Request) {
  try {
    // 1. Parse and validate
    const body = await request.json();
    const parseResult = formInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // 2. Scrape Zillow listing for property data
    const property = await scrapeZillowListing(input.zillowUrl);
    console.log('[Submit] Zillow data:', property.raw ? 'scraped' : 'URL-parsed', property.address);

    // 3. Score
    const score = calculateScore(input, property);

    // 4. Build result URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://leaseup.hearthproperty.com';
    const resultData = encodeURIComponent(
      Buffer.from(JSON.stringify({ input, property, score })).toString('base64')
    );
    const resultUrl = `${siteUrl}/results?data=${resultData}`;

    // 5. Fire Close + Discord in parallel (both non-blocking)
    const [closeResult] = await Promise.allSettled([
      createLead(input, property, score).catch(err => {
        console.error('[Submit] Close CRM failed (non-blocking):', err);
        return undefined;
      }),
      sendLeadNotification(input, property, score, resultUrl).catch(err => {
        console.error('[Submit] Discord failed (non-blocking):', err);
        return false;
      }),
    ]);

    const closeLeadId = closeResult.status === 'fulfilled' ? closeResult.value : undefined;

    // 6. Return success
    return NextResponse.json({
      success: true,
      score,
      property,
      closeLeadId,
      resultUrl,
    });
  } catch (error) {
    console.error('[Submit] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
