/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TargetCategory } from '../types';

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Jakarta timezone.
 */
export function getTodayJakarta(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // en-CA produces YYYY-MM-DD
}

/**
 * Converts YYYY-MM-DD to DD/MM/YYYY for UI display
 */
export function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return '-';
  const clean = dateStr.trim();
  if (!clean) return '-';

  // If already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;

  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Fallback
  return dateStr;
}

/**
 * Parses any date string to YYYY-MM-DD
 */
export function normalizeDateToISO(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // If DD/MM/YYYY
  const slashParts = clean.split('/');
  if (slashParts.length === 3) {
    const [d, m, y] = slashParts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return clean;
}

/**
 * Calculates calendar day difference: (targetDate - today)
 * Positive means days in future, 0 is today, negative is overdue.
 */
export function calculateDaysDiff(targetDateStr: string, baseDateStr?: string): number {
  const base = normalizeDateToISO(baseDateStr || getTodayJakarta());
  const target = normalizeDateToISO(targetDateStr);

  if (!base || !target) return 0;

  // Split components to compare calendar days strictly (avoid DST or time shifts)
  const [by, bm, bd] = base.split('-').map(Number);
  const [ty, tm, td] = target.split('-').map(Number);

  const baseUtc = Date.UTC(by, bm - 1, bd);
  const targetUtc = Date.UTC(ty, tm - 1, td);

  const diffMs = targetUtc - baseUtc;
  return Math.round(diffMs / 86400000);
}

/**
 * Categorize into OVERDUE, TODAY, H-1, H-2, H-3, or ON TRACK
 */
export function getTargetCategory(daysDiff: number): TargetCategory {
  if (daysDiff < 0) return 'OVERDUE';
  if (daysDiff === 0) return 'TODAY';
  if (daysDiff === 1) return 'H-1';
  if (daysDiff === 2) return 'H-2';
  if (daysDiff === 3) return 'H-3';
  return 'ON TRACK';
}

/**
 * Compute OTD (On-Time Delivery): YA if actual <= estimate, else TIDAK
 */
export function computeOTD(actualDate: string, estimateDate: string): 'YA' | 'TIDAK' {
  const normActual = normalizeDateToISO(actualDate);
  const normEstimate = normalizeDateToISO(estimateDate);
  if (!normActual || !normEstimate) return 'TIDAK';

  return normActual <= normEstimate ? 'YA' : 'TIDAK';
}

/**
 * Human readable label for days remaining
 */
export function formatDaysRemaining(daysDiff: number): string {
  if (daysDiff < 0) {
    const abs = Math.abs(daysDiff);
    return `Terlambat ${abs} hari`;
  }
  if (daysDiff === 0) {
    return 'Hari Ini';
  }
  if (daysDiff === 1) {
    return 'Besok (1 hari)';
  }
  return `${daysDiff} hari lagi`;
}
