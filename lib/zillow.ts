// Zillow listing scraper — extracts property data from a Zillow URL.
// Falls back to URL parsing if the page can't be fetched.

import type { ZillowData } from './types';

/**
 * Attempt to scrape property data from a Zillow listing URL.
 * Tries multiple strategies: JSON-LD, meta tags, URL parsing.
 */
export async function scrapeZillowListing(url: string): Promise<ZillowData> {
  // Strategy 1: Try to fetch and parse the page
  try {
    const html = await fetchZillowPage(url);
    if (html) {
      const fromPage = parseZillowHtml(html);
      if (fromPage && fromPage.address) {
        return {
          address: fromPage.address || '',
          city: fromPage.city || '',
          state: fromPage.state || '',
          zipcode: fromPage.zipcode || '',
          bedrooms: fromPage.bedrooms ?? null,
          bathrooms: fromPage.bathrooms ?? null,
          sqft: fromPage.sqft ?? null,
          propertyType: fromPage.propertyType || 'Unknown',
          zestimate: fromPage.zestimate ?? null,
          description: fromPage.description || '',
          imageUrl: fromPage.imageUrl ?? null,
          raw: true,
        };
      }
    }
  } catch (error) {
    console.warn('[Zillow] Page fetch failed, falling back to URL parsing:', error);
  }

  // Strategy 2: Extract what we can from the URL itself
  return parseZillowUrl(url);
}

/**
 * Fetch the Zillow page HTML with browser-like headers.
 */
async function fetchZillowPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (!response.ok) {
      console.warn(`[Zillow] HTTP ${response.status}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.warn('[Zillow] Fetch error:', error);
    return null;
  }
}

/**
 * Parse property data from Zillow page HTML.
 * Tries JSON-LD structured data first, then meta tags.
 */
function parseZillowHtml(html: string): Partial<ZillowData> | null {
  const data: Partial<ZillowData> = {};

  // Try JSON-LD (most reliable structured data)
  try {
    const jsonLdMatch = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        const jsonStr = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
        try {
          const ld = JSON.parse(jsonStr);
          if (ld['@type'] === 'SingleFamilyResidence' || ld['@type'] === 'Residence' || ld['@type'] === 'Product' || ld.address) {
            if (ld.address) {
              data.address = ld.address.streetAddress || '';
              data.city = ld.address.addressLocality || '';
              data.state = ld.address.addressRegion || '';
              data.zipcode = ld.address.postalCode || '';
            }
            if (ld.numberOfRooms) data.bedrooms = Number(ld.numberOfRooms) || null;
            if (ld.floorSize?.value) data.sqft = Number(ld.floorSize.value) || null;
            if (ld.description) data.description = ld.description;
            if (ld.image) data.imageUrl = typeof ld.image === 'string' ? ld.image : ld.image?.url || null;
          }
        } catch { /* skip invalid JSON-LD blocks */ }
      }
    }
  } catch { /* JSON-LD parsing failed */ }

  // Try Open Graph / meta tags
  try {
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];

    if (ogTitle && !data.address) {
      // Zillow og:title is often like "123 Main St, Austin, TX 78701 | Zillow"
      const addressMatch = ogTitle.match(/^(.+?)\s*[|\-–]/);
      if (addressMatch) {
        const parts = addressMatch[1].split(',').map(s => s.trim());
        if (parts.length >= 2) {
          data.address = parts[0];
          data.city = parts[1];
          if (parts[2]) {
            const stateZip = parts[2].trim().split(/\s+/);
            data.state = stateZip[0] || '';
            data.zipcode = stateZip[1] || '';
          }
        }
      }
    }

    if (ogDesc && !data.description) {
      data.description = ogDesc;
      // Try to extract beds/baths from description
      const bedMatch = ogDesc.match(/(\d+)\s*(?:bed|br|bedroom)/i);
      const bathMatch = ogDesc.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i);
      const sqftMatch = ogDesc.match(/([\d,]+)\s*(?:sq\s*ft|sqft|square\s*feet)/i);
      if (bedMatch && !data.bedrooms) data.bedrooms = Number(bedMatch[1]);
      if (bathMatch && !data.bathrooms) data.bathrooms = Number(bathMatch[1]);
      if (sqftMatch && !data.sqft) data.sqft = Number(sqftMatch[1].replace(',', ''));
    }

    if (ogImage && !data.imageUrl) data.imageUrl = ogImage;
  } catch { /* meta tag parsing failed */ }

  // Try to extract property type from page content
  try {
    const typeMatch = html.match(/(?:property\s*type|home\s*type)\s*[:\-]?\s*(Single Family|Condo|Townhouse|Multi[- ]?Family|Duplex|Triplex|Apartment)/i);
    if (typeMatch) data.propertyType = typeMatch[1];
  } catch { /* type extraction failed */ }

  // Try to extract Zestimate
  try {
    const zestMatch = html.match(/Zestimate[^$]*\$\s*([\d,]+)/i);
    if (zestMatch) data.zestimate = Number(zestMatch[1].replace(/,/g, ''));
  } catch { /* zestimate extraction failed */ }

  if (data.address) return data;
  return null;
}

/**
 * Extract property info from the Zillow URL structure as fallback.
 * URLs look like: /homedetails/123-Main-St-Austin-TX-78701/12345_zpid/
 */
function parseZillowUrl(url: string): ZillowData {
  let address = '';
  let city = '';
  let state = '';
  let zipcode = '';

  try {
    // Match homedetails URL pattern
    const pathMatch = url.match(/homedetails\/([^/]+)\//i);
    if (pathMatch) {
      const slug = pathMatch[1];
      // Split by hyphens and try to reconstruct address
      const parts = slug.split('-');

      // Last part is usually zip, second to last is state
      if (parts.length >= 3) {
        const potentialZip = parts[parts.length - 1];
        const potentialState = parts[parts.length - 2];

        if (/^\d{5}$/.test(potentialZip)) {
          zipcode = potentialZip;
          state = potentialState.toUpperCase();

          // Find where the city starts (usually after the street address)
          // Heuristic: city name starts after a numeric street number pattern ends
          const remaining = parts.slice(0, -2);
          // Try to find city by common patterns
          const fullStr = remaining.join(' ');
          address = fullStr.replace(/\s+/g, ' ').trim();

          // Try to separate city from address
          // Common pattern: "123 Main St CityName"
          const cityIndex = remaining.findIndex((p, i) =>
            i > 1 && /^[A-Z]/.test(p) && !/^(St|Ave|Blvd|Dr|Ln|Rd|Ct|Pl|Way|Cir|Pkwy|Apt|Unit|Ste)$/i.test(p)
          );
          if (cityIndex > 1) {
            address = remaining.slice(0, cityIndex).join(' ');
            city = remaining.slice(cityIndex).join(' ');
          }
        }
      }
    }

    // Try /b/ URL pattern (building/apartment)
    if (!address) {
      const bMatch = url.match(/\/b\/([^/]+)\//i);
      if (bMatch) {
        address = bMatch[1].replace(/-/g, ' ');
      }
    }
  } catch {
    // URL parsing failed entirely
  }

  return {
    address: address || 'Property from Zillow listing',
    city: city || '',
    state: state || '',
    zipcode,
    bedrooms: null,
    bathrooms: null,
    sqft: null,
    propertyType: 'Unknown',
    zestimate: null,
    description: '',
    imageUrl: null,
    raw: false,
  };
}
