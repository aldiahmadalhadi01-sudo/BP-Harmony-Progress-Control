/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WorkOrder {
  no_wo: string;
  tanggal_estimasi: string; // YYYY-MM-DD
  tanggal_in: string; // YYYY-MM-DD
  estimasi_selesai: string; // YYYY-MM-DD
  no_polisi: string;
  tipe_kendaraan: string;
  nama_customer: string;
  no_hp: string;
  asuransi: string;
  item_jasa: string;
  item_part: string;
  tambahan_jasa: string;
  tambahan_part: string;
  vendor: string;
  progress: string;
  job_stopped: 'YA' | 'TIDAK';
  keterangan: string;
  created_at: string;
  updated_at: string;
}

export interface ClosedWorkOrder extends WorkOrder {
  aktual_unit_selesai: string; // YYYY-MM-DD
  ontime_delivery: 'YA' | 'TIDAK';
  closed_at: string;
}

export type TargetCategory = 'OVERDUE' | 'TODAY' | 'H-1' | 'H-2' | 'H-3' | 'ON TRACK';

export interface TargetUnit extends WorkOrder {
  selisih_hari: number;
  status_target: TargetCategory;
}

export interface DashboardSummary {
  total_wip: number;
  total_close_month: number;
  target_today: number;
  near_target: number;
  overdue: number;
  otd_count_ya: number;
  otd_count_tidak: number;
  otd_percentage: number;
  monthly_in: { month: string; label: string; count: number }[];
  monthly_close: { month: string; label: string; count: number }[];
  progress_dist: { progress: string; count: number }[];
  today_units: WorkOrder[];
  overdue_units: WorkOrder[];
  job_stopped_units: WorkOrder[];
  connection_status: {
    connected_to_sheets: boolean;
    mode: 'GOOGLE_SHEETS' | 'LOCAL_DEMO';
    spreadsheet_id?: string;
    error_message?: string;
  };
}

export const WIP_HEADERS: (keyof WorkOrder)[] = [
  'no_wo',
  'tanggal_estimasi',
  'tanggal_in',
  'estimasi_selesai',
  'no_polisi',
  'tipe_kendaraan',
  'nama_customer',
  'no_hp',
  'asuransi',
  'item_jasa',
  'item_part',
  'tambahan_jasa',
  'tambahan_part',
  'vendor',
  'progress',
  'job_stopped',
  'keterangan',
  'created_at',
  'updated_at',
];

export const UNIT_CLOSE_HEADERS: (keyof ClosedWorkOrder)[] = [
  'no_wo',
  'tanggal_estimasi',
  'tanggal_in',
  'estimasi_selesai',
  'no_polisi',
  'tipe_kendaraan',
  'nama_customer',
  'no_hp',
  'asuransi',
  'item_jasa',
  'item_part',
  'tambahan_jasa',
  'tambahan_part',
  'vendor',
  'progress',
  'job_stopped',
  'keterangan',
  'created_at',
  'updated_at',
  'aktual_unit_selesai',
  'ontime_delivery',
  'closed_at',
];

export const DEFAULT_PROGRESS_OPTIONS = [
  'Bongkar',
  'Ketok / Las',
  'Dempul',
  'Epoxy',
  'Cat / Oven',
  'Poles',
  'Pasang / Assembling',
  'Finishing & QC',
  'Cuci & Siap Delivery',
];

export const DEFAULT_VENDORS = [
  'Bengkel Internal (Main Shop)',
  'Sublet Cat Oven Express',
  'Sublet Las & Ketok Presisi',
  'Glass & Windshield Pro',
  'Sublet PDR & Dent Specialist',
  'Toko Part & Material Mitra',
];
