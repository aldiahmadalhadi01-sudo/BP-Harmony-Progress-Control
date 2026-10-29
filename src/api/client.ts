/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkOrder, ClosedWorkOrder, DashboardSummary, TargetUnit } from '../types';

export const api = {
  async getHealth() {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Gagal memeriksa status API');
    return res.json();
  },

  async getWebAppUrl(): Promise<{ web_app_url: string }> {
    const res = await fetch('/api/config/webapp');
    return res.json();
  },

  async saveWebAppUrl(web_app_url: string): Promise<{ success: boolean; message: string; health: any }> {
    const res = await fetch('/api/config/webapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ web_app_url }),
    });
    return res.json();
  },

  async setupDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/setup-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async seedData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/seed-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async getDashboard(): Promise<DashboardSummary> {
    const res = await fetch('/api/dashboard');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || 'Gagal memuat ringkasan dashboard');
    }
    return res.json();
  },

  async getWipList(params?: {
    q?: string;
    vendor?: string;
    progress?: string;
    job_stopped?: string;
    estimasi_selesai?: string;
  }): Promise<WorkOrder[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.q) searchParams.set('q', params.q);
      if (params.vendor && params.vendor !== 'ALL') searchParams.set('vendor', params.vendor);
      if (params.progress && params.progress !== 'ALL') searchParams.set('progress', params.progress);
      if (params.job_stopped && params.job_stopped !== 'ALL') searchParams.set('job_stopped', params.job_stopped);
      if (params.estimasi_selesai) searchParams.set('estimasi_selesai', params.estimasi_selesai);
    }
    const url = `/api/wip${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal mengambil data WIP');
    return res.json();
  },

  async createWip(data: Partial<WorkOrder>): Promise<WorkOrder> {
    const res = await fetch('/api/wip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Gagal menyimpan Work Order');
    }
    return result;
  },

  async getWipDetail(no_wo: string): Promise<WorkOrder | ClosedWorkOrder> {
    const res = await fetch(`/api/wip/${encodeURIComponent(no_wo)}`);
    if (!res.ok) throw new Error(`Work Order ${no_wo} tidak ditemukan`);
    return res.json();
  },

  async updateWip(no_wo: string, updates: Partial<WorkOrder>): Promise<WorkOrder> {
    const res = await fetch(`/api/wip/${encodeURIComponent(no_wo)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Gagal memperbarui Work Order');
    }
    return result;
  },

  async closeUnit(no_wo: string, aktual_unit_selesai: string): Promise<{ success: boolean; data: ClosedWorkOrder }> {
    const res = await fetch(`/api/wip/${encodeURIComponent(no_wo)}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktual_unit_selesai }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Gagal menutup unit');
    }
    return result;
  },

  async getClosedList(params?: {
    q?: string;
    vendor?: string;
    otd?: string;
    aktual_unit_selesai?: string;
  }): Promise<ClosedWorkOrder[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.q) searchParams.set('q', params.q);
      if (params.vendor && params.vendor !== 'ALL') searchParams.set('vendor', params.vendor);
      if (params.otd && params.otd !== 'ALL') searchParams.set('otd', params.otd);
      if (params.aktual_unit_selesai) searchParams.set('aktual_unit_selesai', params.aktual_unit_selesai);
    }
    const url = `/api/unit-close${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal mengambil data Unit Close');
    return res.json();
  },

  async getTargetUnits(): Promise<TargetUnit[]> {
    const res = await fetch('/api/target-selesai');
    if (!res.ok) throw new Error('Gagal mengambil data target selesai');
    return res.json();
  },

  getExportCsvUrl(): string {
    return '/api/export/unit-close';
  },
};
