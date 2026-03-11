// Hardcoded scoring configuration — no database needed.
// All weights and thresholds live here for easy tuning.

import type { ManagementSituation } from './types';

// --- Days on Market scoring ---
// Higher days = higher urgency
export const DOM_THRESHOLDS = [
  { max: 7,   score: 1, label: 'Just listed — still early' },
  { max: 14,  score: 2, label: 'Two weeks — normal window' },
  { max: 21,  score: 4, label: 'Three weeks — slowing down' },
  { max: 30,  score: 5, label: 'A full month — needs attention' },
  { max: 45,  score: 7, label: 'Six weeks — significantly behind market' },
  { max: 60,  score: 8, label: 'Two months — serious leasing issues likely' },
  { max: 90,  score: 9, label: 'Three months — urgent intervention needed' },
  { max: Infinity, score: 10, label: 'Extended vacancy — maximum urgency' },
] as const;

// --- Vacancy factor ---
export const VACANCY_BONUS = 2;
export const VACANCY_COST_FACTOR = 1.0; // 100% of asking rent lost per month when vacant

// --- Management situation modifier ---
export const MANAGEMENT_MODIFIER: Record<ManagementSituation, number> = {
  'Self-managed': 1,
  'Have a PM': -1,
  'No PM yet': 2,
};

// --- Urgency label thresholds ---
export const URGENCY_LABELS = [
  { max: 3, label: 'Low' as const },
  { max: 5, label: 'Moderate' as const },
  { max: 7, label: 'High' as const },
  { max: 10, label: 'Critical' as const },
] as const;
