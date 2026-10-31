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
 * Parses any date string or Date representation into strictly YYYY-MM-DD.
 * Handles:
 * - Google Sheets Date strings: "Wed Jul 29 2026 14:00:00 GMT+0700..."
 * - ISO timestamps: "2026-07-29T07:00:00.000Z"
 * - DD/MM/YYYY or DD-MM-YYYY
 * - Standard YYYY-MM-DD
 * - If text is not a date (e.g. "ORDER PART" or "-"), returns the clean text
 */
export function normalizeDateToISO(dateStr?: string | any): string {
  if (!dateStr) return '';
  const clean = String(dateStr).trim();
  if (!clean || clean === '-') return '';

  // Standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // DD/MM/YYYY or DD-MM-YYYY
  const slashParts = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashParts) {
    const [, d, m, y] = slashParts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // ISO timestamp starting with YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}T/.test(clean)) {
    return clean.slice(0, 10);
  }

  // Check if it's a parseable Date string (e.g. from Google Apps Script getValues())
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(parsed); // en-CA produces YYYY-MM-DD
    } catch {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  return clean;
}

/**
 * Formats any date to strictly DD/MM/YYYY (hanya tanggal saja, tanpa jam/GMT).
 * Non-date text (such as 'ORDER PART') is preserved as-is.
 */
export function formatDateIndo(dateStr?: string | any): string {
  if (!dateStr) return '-';
  const clean = String(dateStr).trim();
  if (!clean || clean === '-') return '-';

  const iso = normalizeDateToISO(clean);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  // Return clean string if not a parseable date
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
