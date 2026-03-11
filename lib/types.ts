import { z } from 'zod';

// --- Form Input Schema (what the user submits) ---
export const formInputSchema = z.object({
  ownerName: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(7, 'Phone number is required'),
  zillowUrl: z.string().url('Valid URL is required').refine(
    (url) => /zillow\.com/i.test(url),
    'Must be a Zillow listing URL'
  ),
  askingRent: z.number().min(0, 'Enter your asking rent'),
  daysOnMarket: z.number().min(0, 'Enter days on market'),
  currentlyVacant: z.boolean(),
  managementSituation: z.enum(['Self-managed', 'Have a PM', 'No PM yet']),
});

export type FormInput = z.infer<typeof formInputSchema>;

// --- Zillow Scraped Data ---
export interface ZillowData {
  address: string;
  city: string;
  state: string;
  zipcode: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  propertyType: string;
  zestimate: number | null;
  description: string;
  imageUrl: string | null;
  raw: boolean; // true if we got real data, false if we fell back to URL parsing
}

// --- Combined submission data (form + scraped) ---
export interface EnrichedSubmission {
  form: FormInput;
  property: ZillowData;
}

// --- Scoring Output ---
export type UrgencyLabel = 'Critical' | 'High' | 'Moderate' | 'Low';

export interface ScoreResult {
  urgencyScore: number;       // 1–10
  urgencyLabel: UrgencyLabel;
  estimatedMonthlyLoss: number;
  estimatedAnnualLoss: number;
  findings: string[];          // 3–5 bullets
  recommendation: string;
}

// --- API Response ---
export interface SubmitResponse {
  success: boolean;
  score: ScoreResult;
  property: ZillowData;
  closeLeadId?: string;
  resultUrl: string;
}

// --- Management situation type ---
export type ManagementSituation = FormInput['managementSituation'];
