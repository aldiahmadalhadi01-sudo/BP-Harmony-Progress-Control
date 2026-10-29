/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sheetsService } from './sheetsService.js';
import { DashboardSummary, TargetUnit, WorkOrder } from '../src/types.js';
import { calculateDaysDiff, getTargetCategory, getTodayJakarta } from '../src/utils/dateHelper.js';

export async function getDashboardData(): Promise<DashboardSummary> {
  const wipList = await sheetsService.getWipList();
  const closedList = await sheetsService.getClosedList();
  const health = await sheetsService.getHealth();

  const todayStr = getTodayJakarta(); // YYYY-MM-DD
  const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

  // Process WIP units with target diff
  const wipWithTarget: TargetUnit[] = wipList.map((wo) => {
    const diff = calculateDaysDiff(wo.estimasi_selesai, todayStr);
    return {
      ...wo,
      selisih_hari: diff,
      status_target: getTargetCategory(diff),
    };
  });

  const total_wip = wipList.length;

  // Closed units this month (based on aktual_unit_selesai)
  const closedThisMonth = closedList.filter((c) => {
    const act = (c.aktual_unit_selesai || '').substring(0, 7);
    return act === currentMonthPrefix;
  });
  const total_close_month = closedThisMonth.length;

  // Targets
  const today_units = wipWithTarget.filter((u) => u.status_target === 'TODAY');
  const target_today = today_units.length;

  const near_target_units = wipWithTarget.filter(
    (u) => u.status_target === 'H-1' || u.status_target === 'H-2' || u.status_target === 'H-3'
  );
  const near_target = near_target_units.length;

  // Overdue units: sorted so most overdue are at top
  const overdue_units = wipWithTarget
    .filter((u) => u.status_target === 'OVERDUE')
    .sort((a, b) => a.selisih_hari - b.selisih_hari);
  const overdue = overdue_units.length;

  // Job stopped
  const job_stopped_units = wipList.filter((u) => u.job_stopped === 'YA');

  // OTD calculation
  const otd_count_ya = closedList.filter((c) => c.ontime_delivery === 'YA').length;
  const otd_count_tidak = closedList.filter((c) => c.ontime_delivery === 'TIDAK').length;
  const total_otd_valid = otd_count_ya + otd_count_tidak;
  const otd_percentage =
    total_otd_valid > 0 ? Math.round((otd_count_ya / total_otd_valid) * 100 * 10) / 10 : 0;

  // Monthly stats (last 6 months)
  const monthMap: Record<string, { label: string; inCount: number; closeCount: number }> = {};
  const dateObj = new Date();
  const monthNamesIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(dateObj.getFullYear(), dateObj.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${yyyy}-${mm}`;
    const label = `${monthNamesIndo[d.getMonth()]} ${yyyy}`;
    monthMap[key] = { label, inCount: 0, closeCount: 0 };
  }

  // Count incoming WOs (from WIP and UNIT_CLOSE)
  const allWos: WorkOrder[] = [...wipList, ...closedList];
  allWos.forEach((w) => {
    const key = (w.tanggal_in || '').substring(0, 7);
    if (monthMap[key]) {
      monthMap[key].inCount++;
    }
  });

  // Count closed WOs
  closedList.forEach((c) => {
    const key = (c.aktual_unit_selesai || '').substring(0, 7);
    if (monthMap[key]) {
      monthMap[key].closeCount++;
    }
  });

  const monthly_in = Object.entries(monthMap).map(([month, data]) => ({
    month,
    label: data.label,
    count: data.inCount,
  }));

  const monthly_close = Object.entries(monthMap).map(([month, data]) => ({
    month,
    label: data.label,
    count: data.closeCount,
  }));

  // Progress distribution for WIP
  const progressMap: Record<string, number> = {};
  wipList.forEach((w) => {
    const p = w.progress || 'Lainnya';
    progressMap[p] = (progressMap[p] || 0) + 1;
  });

  const progress_dist = Object.entries(progressMap).map(([progress, count]) => ({
    progress,
    count,
  }));

  return {
    total_wip,
    total_close_month,
    target_today,
    near_target,
    overdue,
    otd_count_ya,
    otd_count_tidak,
    otd_percentage,
    monthly_in,
    monthly_close,
    progress_dist,
    today_units,
    overdue_units,
    job_stopped_units,
    connection_status: {
      connected_to_sheets: health.connected_to_sheets,
      mode: health.mode,
      spreadsheet_id: health.spreadsheet_id,
      error_message: health.error_message,
    },
  };
}

export async function getTargetUnits(): Promise<TargetUnit[]> {
  const wipList = await sheetsService.getWipList();
  const todayStr = getTodayJakarta();

  const categorized: TargetUnit[] = wipList.map((wo) => {
    const diff = calculateDaysDiff(wo.estimasi_selesai, todayStr);
    return {
      ...wo,
      selisih_hari: diff,
      status_target: getTargetCategory(diff),
    };
  });

  // Sort priority:
  // 1. OVERDUE first (most overdue first: e.g. -5 before -1)
  // 2. TODAY second
  // 3. H-1, H-2, H-3
  // 4. ON TRACK
  const categoryOrder: Record<string, number> = {
    OVERDUE: 1,
    TODAY: 2,
    'H-1': 3,
    'H-2': 4,
    'H-3': 5,
    'ON TRACK': 6,
  };

  categorized.sort((a, b) => {
    const orderA = categoryOrder[a.status_target] || 99;
    const orderB = categoryOrder[b.status_target] || 99;
    if (orderA !== orderB) return orderA - orderB;
    // Inside same category, sort by selisih_hari ascending
    return a.selisih_hari - b.selisih_hari;
  });

  return categorized;
}
