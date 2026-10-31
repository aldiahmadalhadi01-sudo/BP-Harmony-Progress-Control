/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { google, sheets_v4 } from 'googleapis';
import { WorkOrder, ClosedWorkOrder, WIP_HEADERS, UNIT_CLOSE_HEADERS } from '../src/types.js';
import { INITIAL_WIP_DATA, INITIAL_CLOSED_DATA } from './initialData.js';
import { computeOTD, getTodayJakarta, normalizeDateToISO } from '../src/utils/dateHelper.js';

export const DEFAULT_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbxBZ2thK3utL_2wnyJPmoiP1lu9bWwyTTFmu9nU8QiLB3elTCcDLxqpu_ch2kYE4tNEBg/exec';

function cleanRowDates<T extends Record<string, any>>(item: T): T {
  if (!item) return item;
  const cleaned: any = { ...item };
  const dateKeys = ['tanggal_estimasi', 'tanggal_in', 'estimasi_selesai', 'aktual_unit_selesai'];
  for (const k of dateKeys) {
    if (k in cleaned && cleaned[k] !== undefined && cleaned[k] !== null && String(cleaned[k]).trim() !== '') {
      const normalized = normalizeDateToISO(cleaned[k]);
      if (normalized) {
        cleaned[k] = normalized;
      }
    }
  }
  return cleaned as T;
}

// In-memory store used when Google Sheets credentials are not set or for instant local fallback
let localWip: WorkOrder[] = [...INITIAL_WIP_DATA].map(cleanRowDates);
let localClosed: ClosedWorkOrder[] = [...INITIAL_CLOSED_DATA].map(cleanRowDates);
const closeLock = new Set<string>(); // Lock for in-progress unit close operations

export interface ConnectionStatus {
  connected_to_sheets: boolean;
  mode: 'GOOGLE_SHEETS' | 'LOCAL_DEMO';
  method?: 'WEB_APP_URL' | 'SERVICE_ACCOUNT' | 'LOCAL';
  spreadsheet_id?: string;
  service_account_email?: string;
  web_app_url?: string;
  error_message?: string;
  wip_rows_count?: number;
  closed_rows_count?: number;
}

/**
 * Validates and normalizes Google Service Account private key PEM format.
 */
function normalizeAndValidatePrivateKey(rawKey?: string): { valid: boolean; key?: string; error?: string } {
  if (!rawKey) {
    return { valid: false, error: 'GOOGLE_PRIVATE_KEY tidak ditemukan.' };
  }

  let key = rawKey.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }

  if (!key.includes('-----BEGIN') || !key.includes('PRIVATE KEY-----') || key.length < 100) {
    return {
      valid: false,
      error: 'GOOGLE_PRIVATE_KEY harus berupa kunci RSA PEM lengkap (dimulai dengan -----BEGIN PRIVATE KEY----- dan diakhiri -----END PRIVATE KEY-----).',
    };
  }

  try {
    crypto.createPrivateKey({ key, format: 'pem' });
    return { valid: true, key };
  } catch (err: any) {
    return {
      valid: false,
      error: `Format GOOGLE_PRIVATE_KEY tidak valid untuk OpenSSL: ${err?.message || 'DECODER routines::unsupported'}`,
    };
  }
}

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets | null = null;
  private spreadsheetId: string = '';
  private authError: string | null = null;
  private webAppUrl: string = process.env.GOOGLE_SHEETS_WEBAPP_URL?.trim() || DEFAULT_WEB_APP_URL;

  constructor() {
    this.initClient();
  }

  public setWebAppUrl(url: string) {
    this.webAppUrl = url.trim();
  }

  public getWebAppUrl(): string {
    return this.webAppUrl;
  }

  public initClient() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();

    if (!email || !rawPrivateKey || !spreadsheetId) {
      this.sheets = null;
      this.spreadsheetId = spreadsheetId || '';
      this.authError = 'Kredensial Service Account belum lengkap di environment variable.';
      return;
    }

    const keyValidation = normalizeAndValidatePrivateKey(rawPrivateKey);
    if (!keyValidation.valid || !keyValidation.key) {
      this.sheets = null;
      this.spreadsheetId = spreadsheetId;
      this.authError = keyValidation.error || 'Format private key tidak valid.';
      return;
    }

    try {
      const auth = new google.auth.JWT({
        email,
        key: keyValidation.key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.spreadsheetId = spreadsheetId;
      this.authError = null;
    } catch (err: any) {
      this.sheets = null;
      this.spreadsheetId = spreadsheetId;
      this.authError = err?.message || 'Gagal menginisialisasi Google Auth client';
    }
  }

  /**
   * Health check and connection validation
   */
  public async getHealth(): Promise<ConnectionStatus> {
    // 1. Check if Apps Script Web App URL is configured (NO SERVICE ACCOUNT NEEDED)
    if (this.webAppUrl) {
      try {
        const testRes = await fetch(`${this.webAppUrl}?action=health`, {
          redirect: 'follow',
        });
        if (testRes.ok) {
          const json = await testRes.json();
          // Count rows
          const wipList = await this.getWipList();
          const closedList = await this.getClosedList();

          return {
            connected_to_sheets: true,
            mode: 'GOOGLE_SHEETS',
            method: 'WEB_APP_URL',
            web_app_url: this.webAppUrl,
            error_message: `Terhubung via Google Apps Script Web App ke Spreadsheet '${json.spreadsheet_name || 'BPMS_WO_DATABASE'}' (Tanpa Service Account)`,
            wip_rows_count: wipList.length,
            closed_rows_count: closedList.length,
          };
        }
      } catch (err: any) {
        return {
          connected_to_sheets: false,
          mode: 'LOCAL_DEMO',
          method: 'WEB_APP_URL',
          web_app_url: this.webAppUrl,
          error_message: `Gagal menghubungi Google Apps Script Web App: ${err?.message}. Pastikan akses diatur ke 'Anyone'.`,
          wip_rows_count: localWip.length,
          closed_rows_count: localClosed.length,
        };
      }
    }

    // 2. Check Service Account credentials
    this.initClient();

    if (!this.sheets || !this.spreadsheetId) {
      return {
        connected_to_sheets: false,
        mode: 'LOCAL_DEMO',
        method: 'LOCAL',
        spreadsheet_id: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || undefined,
        service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || undefined,
        web_app_url: this.webAppUrl || undefined,
        error_message:
          this.authError ||
          'Google Sheets belum terhubung. Anda dapat menghubungkan spreadsheet secara langsung dengan memasang Google Apps Script Web App (tanpa Service Account) atau mengisi Service Account JSON.',
        wip_rows_count: localWip.length,
        closed_rows_count: localClosed.length,
      };
    }

    try {
      const meta = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheetNames = (meta.data.sheets || []).map((s) => s.properties?.title || '');
      const hasWip = sheetNames.includes('WIP');
      const hasClosed = sheetNames.includes('UNIT_CLOSE');

      if (!hasWip || !hasClosed) {
        return {
          connected_to_sheets: false,
          mode: 'GOOGLE_SHEETS',
          method: 'SERVICE_ACCOUNT',
          spreadsheet_id: this.spreadsheetId,
          service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          error_message: `Spreadsheet terhubung, tetapi worksheet '${!hasWip ? 'WIP ' : ''}${!hasClosed ? 'UNIT_CLOSE' : ''}' belum ada. Klik Setup Database untuk inisialisasi otomatis.`,
        };
      }

      const wipData = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'WIP!A2:A',
      });
      const closedData = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'UNIT_CLOSE!A2:A',
      });

      return {
        connected_to_sheets: true,
        mode: 'GOOGLE_SHEETS',
        method: 'SERVICE_ACCOUNT',
        spreadsheet_id: this.spreadsheetId,
        service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        wip_rows_count: (wipData.data.values || []).length,
        closed_rows_count: (closedData.data.values || []).length,
      };
    } catch (err: any) {
      this.authError = err?.message || 'Akses ditolak atau Spreadsheet ID salah';
      return {
        connected_to_sheets: false,
        mode: 'LOCAL_DEMO',
        method: 'SERVICE_ACCOUNT',
        spreadsheet_id: this.spreadsheetId,
        service_account_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        error_message: `Koneksi Google Sheets gagal: ${this.authError}. Berikan hak akses 'Editor' ke email service account.`,
        wip_rows_count: localWip.length,
        closed_rows_count: localClosed.length,
      };
    }
  }

  /**
   * Initializes or verifies headers on Google Sheets
   */
  public async setupDatabase(): Promise<{ success: boolean; message: string }> {
    // Via Apps Script Web App
    if (this.webAppUrl) {
      try {
        const res = await fetch(this.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'setup' }),
          redirect: 'follow',
        });
        const json = await res.json();
        return {
          success: Boolean(json.success),
          message: json.message || json.error || 'Worksheet WIP dan UNIT_CLOSE berhasil dibuat di Google Sheets!',
        };
      } catch (err: any) {
        return { success: false, message: `Gagal setup via Web App: ${err?.message}` };
      }
    }

    // Via Service Account
    this.initClient();
    if (!this.sheets || !this.spreadsheetId) {
      return {
        success: false,
        message: this.authError || 'Koneksi Google Sheets belum terkonfigurasi.',
      };
    }

    try {
      const meta = await this.sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
      const existingSheets = (meta.data.sheets || []).map((s) => s.properties?.title || '');
      const requests: sheets_v4.Schema$Request[] = [];

      if (!existingSheets.includes('WIP')) {
        requests.push({
          addSheet: { properties: { title: 'WIP', gridProperties: { frozenRowCount: 1 } } },
        });
      }

      if (!existingSheets.includes('UNIT_CLOSE')) {
        requests.push({
          addSheet: { properties: { title: 'UNIT_CLOSE', gridProperties: { frozenRowCount: 1 } } },
        });
      }

      if (requests.length > 0) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: { requests },
        });
      }

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'WIP!A1:S1',
        valueInputOption: 'RAW',
        requestBody: { values: [WIP_HEADERS] },
      });

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'UNIT_CLOSE!A1:V1',
        valueInputOption: 'RAW',
        requestBody: { values: [UNIT_CLOSE_HEADERS] },
      });

      return {
        success: true,
        message: 'Worksheet WIP dan UNIT_CLOSE berhasil dibuat dan header kolom telah disinkronkan!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal setup spreadsheet: ${err?.message || 'Error tidak diketahui'}`,
      };
    }
  }

  /**
   * Seed sample data into Google Sheets if empty
   */
  public async seedInitialData(): Promise<{ success: boolean; message: string }> {
    // Via Apps Script Web App
    if (this.webAppUrl) {
      try {
        for (const item of INITIAL_WIP_DATA) {
          await fetch(this.webAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'create_wip', data: item }),
            redirect: 'follow',
          });
        }
        return { success: true, message: 'Data contoh bengkel berhasil diimpor ke Google Sheets.' };
      } catch (err: any) {
        return { success: false, message: `Gagal seed data: ${err?.message}` };
      }
    }

    // Via Service Account
    this.initClient();
    if (!this.sheets || !this.spreadsheetId) {
      return { success: false, message: 'Google Sheets belum terkonfigurasi atau kredensial belum valid.' };
    }

    try {
      const currentWip = await this.getWipList();
      if (currentWip.length === 0) {
        const rows = INITIAL_WIP_DATA.map((item) =>
          WIP_HEADERS.map((h) => String(item[h] ?? ''))
        );
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'WIP!A2',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: rows },
        });
      }

      const currentClosed = await this.getClosedList();
      if (currentClosed.length === 0) {
        const rows = INITIAL_CLOSED_DATA.map((item) =>
          UNIT_CLOSE_HEADERS.map((h) => String(item[h] ?? ''))
        );
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: 'UNIT_CLOSE!A2',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: rows },
        });
      }

      return { success: true, message: 'Data contoh bengkel berhasil diimpor ke Google Sheets.' };
    } catch (err: any) {
      return { success: false, message: `Gagal mengimpor data: ${err?.message}` };
    }
  }

  // ======================= WIP OPERATIONS =======================

  public async getWipList(): Promise<WorkOrder[]> {
    // 1. Check Apps Script Web App
    if (this.webAppUrl) {
      try {
        const res = await fetch(`${this.webAppUrl}?action=get_wip`, { redirect: 'follow' });
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.data)) {
            const cleaned = json.data.map(cleanRowDates);
            localWip = cleaned;
            return cleaned;
          }
        }
      } catch {
        // Fallback to local
      }
      return [...localWip];
    }

    // 2. Check Service Account
    if (!this.sheets || !this.spreadsheetId) {
      return [...localWip];
    }

    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'WIP!A1:S',
      });

      const values = res.data.values;
      if (!values || values.length <= 1) return [];

      const headers = values[0] as string[];
      const dataRows = values.slice(1);

      return dataRows
        .filter((row) => row && row[0] && row[0].trim() !== '')
        .map((row) => {
          const item: any = {};
          WIP_HEADERS.forEach((headerKey) => {
            const idx = headers.indexOf(headerKey);
            item[headerKey] = idx !== -1 && row[idx] !== undefined ? String(row[idx]).trim() : '';
          });
          return cleanRowDates(item as WorkOrder);
        });
    } catch {
      return [...localWip];
    }
  }

  public async getClosedList(): Promise<ClosedWorkOrder[]> {
    // 1. Check Apps Script Web App
    if (this.webAppUrl) {
      try {
        const res = await fetch(`${this.webAppUrl}?action=get_closed`, { redirect: 'follow' });
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.data)) {
            const cleaned = json.data.map(cleanRowDates);
            localClosed = cleaned;
            return cleaned;
          }
        }
      } catch {
        // Fallback to local
      }
      return [...localClosed];
    }

    // 2. Check Service Account
    if (!this.sheets || !this.spreadsheetId) {
      return [...localClosed];
    }

    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'UNIT_CLOSE!A1:V',
      });

      const values = res.data.values;
      if (!values || values.length <= 1) return [];

      const headers = values[0] as string[];
      const dataRows = values.slice(1);

      return dataRows
        .filter((row) => row && row[0] && row[0].trim() !== '')
        .map((row) => {
          const item: any = {};
          UNIT_CLOSE_HEADERS.forEach((headerKey) => {
            const idx = headers.indexOf(headerKey);
            item[headerKey] = idx !== -1 && row[idx] !== undefined ? String(row[idx]).trim() : '';
          });
          return item as ClosedWorkOrder;
        });
    } catch {
      return [...localClosed];
    }
  }

  public async findByNoWo(no_wo: string): Promise<{ item: WorkOrder | ClosedWorkOrder | null; isClosed: boolean }> {
    const cleanNoWo = no_wo.trim();

    const wipList = await this.getWipList();
    const inWip = wipList.find((w) => w.no_wo.toLowerCase() === cleanNoWo.toLowerCase());
    if (inWip) return { item: inWip, isClosed: false };

    const closedList = await this.getClosedList();
    const inClosed = closedList.find((c) => c.no_wo.toLowerCase() === cleanNoWo.toLowerCase());
    if (inClosed) return { item: inClosed, isClosed: true };

    return { item: null, isClosed: false };
  }

  public async createWip(data: Omit<WorkOrder, 'created_at' | 'updated_at'>): Promise<WorkOrder> {
    const cleanNoWo = data.no_wo.trim();

    const existing = await this.findByNoWo(cleanNoWo);
    if (existing.item) {
      throw new Error(`Nomor Work Order '${cleanNoWo}' sudah terdaftar (${existing.isClosed ? 'Sudah Ditutup/Close' : 'Sedang Aktif di WIP'}). Gunakan No WO yang unik.`);
    }

    const now = new Date().toISOString();
    const newWo: WorkOrder = {
      ...data,
      no_wo: cleanNoWo,
      tanggal_estimasi: normalizeDateToISO(data.tanggal_estimasi) || data.tanggal_estimasi || '',
      tanggal_in: normalizeDateToISO(data.tanggal_in) || data.tanggal_in || '',
      estimasi_selesai: normalizeDateToISO(data.estimasi_selesai) || data.estimasi_selesai || '',
      created_at: now,
      updated_at: now,
      job_stopped: data.job_stopped === 'YA' ? 'YA' : 'TIDAK',
    };

    // Apps Script Web App sync
    if (this.webAppUrl) {
      try {
        const res = await fetch(this.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'create_wip', data: newWo }),
          redirect: 'follow',
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || 'Gagal menyimpan ke Google Sheets via Web App');
        }
      } catch (err: any) {
        console.warn('Web App create_wip error:', err?.message);
      }
      localWip.unshift(newWo);
      return newWo;
    }

    // Service Account sync
    if (!this.sheets || !this.spreadsheetId) {
      localWip.unshift(newWo);
      return newWo;
    }

    try {
      const headerRes = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'WIP!A1:S1',
      });
      const headers = (headerRes.data.values?.[0] as string[]) || WIP_HEADERS;

      const rowValues = headers.map((h) => {
        const val = (newWo as any)[h];
        return val !== undefined && val !== null ? String(val) : '';
      });

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'WIP!A:A',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [rowValues] },
      });

      localWip.unshift(newWo);
      return newWo;
    } catch {
      localWip.unshift(newWo);
      return newWo;
    }
  }

  public async updateWip(no_wo: string, updates: Partial<WorkOrder>): Promise<WorkOrder> {
    const cleanNoWo = no_wo.trim();
    const cleanUpdates = { ...updates };
    if (cleanUpdates.tanggal_estimasi) {
      cleanUpdates.tanggal_estimasi = normalizeDateToISO(cleanUpdates.tanggal_estimasi);
    }
    if (cleanUpdates.tanggal_in) {
      cleanUpdates.tanggal_in = normalizeDateToISO(cleanUpdates.tanggal_in);
    }
    if (cleanUpdates.estimasi_selesai) {
      cleanUpdates.estimasi_selesai = normalizeDateToISO(cleanUpdates.estimasi_selesai);
    }

    // Apps Script Web App sync
    if (this.webAppUrl) {
      try {
        await fetch(this.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'update_wip', no_wo: cleanNoWo, data: cleanUpdates }),
          redirect: 'follow',
        });
      } catch (err: any) {
        console.warn('Web App update_wip error:', err?.message);
      }

      const idx = localWip.findIndex((w) => w.no_wo.toLowerCase() === cleanNoWo.toLowerCase());
      if (idx !== -1) {
        localWip[idx] = cleanRowDates({ ...localWip[idx], ...cleanUpdates, updated_at: new Date().toISOString() });
        return localWip[idx];
      }
      throw new Error(`Work Order '${cleanNoWo}' tidak ditemukan di WIP.`);
    }

    // Service Account sync
    if (!this.sheets || !this.spreadsheetId) {
      const idx = localWip.findIndex((w) => w.no_wo.toLowerCase() === cleanNoWo.toLowerCase());
      if (idx === -1) {
        throw new Error(`Work Order '${cleanNoWo}' tidak ditemukan di WIP.`);
      }
      const updated: WorkOrder = cleanRowDates({
        ...localWip[idx],
        ...cleanUpdates,
        no_wo: localWip[idx].no_wo,
        created_at: localWip[idx].created_at,
        updated_at: new Date().toISOString(),
      });
      localWip[idx] = updated;
      return updated;
    }

    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'WIP!A1:S',
      });

      const values = res.data.values;
      if (!values || values.length <= 1) {
        throw new Error(`Work Order '${cleanNoWo}' tidak ditemukan di spreadsheet.`);
      }

      const headers = values[0] as string[];
      const noWoColIdx = headers.indexOf('no_wo');
      if (noWoColIdx === -1) throw new Error('Kolom no_wo tidak ditemukan di header WIP');

      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (values[i][noWoColIdx]?.toString().trim().toLowerCase() === cleanNoWo.toLowerCase()) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex === -1) {
        throw new Error(`Work Order '${cleanNoWo}' tidak ditemukan di tabel WIP.`);
      }

      const currentRow = values[rowIndex - 1];
      const currentWo: any = {};
      headers.forEach((h, idx) => {
        currentWo[h] = currentRow[idx] !== undefined ? String(currentRow[idx]) : '';
      });

      const updatedWo: WorkOrder = cleanRowDates({
        ...currentWo,
        ...cleanUpdates,
        no_wo: currentWo.no_wo,
        created_at: currentWo.created_at,
        updated_at: new Date().toISOString(),
      });

      const updatedRowValues = headers.map((h) => {
        const val = (updatedWo as any)[h];
        return val !== undefined && val !== null ? String(val) : '';
      });

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `WIP!A${rowIndex}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRowValues] },
      });

      const lIdx = localWip.findIndex((w) => w.no_wo.toLowerCase() === cleanNoWo.toLowerCase());
      if (lIdx !== -1) localWip[lIdx] = updatedWo;

      return updatedWo;
    } catch {
      const idx = localWip.findIndex((w) => w.no_wo.toLowerCase() === cleanNoWo.toLowerCase());
      if (idx !== -1) {
        localWip[idx] = cleanRowDates({ ...localWip[idx], ...cleanUpdates, updated_at: new Date().toISOString() });
        return localWip[idx];
      }
      throw new Error(`Gagal memperbarui WO '${cleanNoWo}'`);
    }
  }

  public async closeUnit(no_wo: string, aktual_unit_selesai: string): Promise<ClosedWorkOrder> {
    const cleanNoWo = no_wo.trim();

    if (closeLock.has(cleanNoWo)) {
      throw new Error(`Transaksi Unit Close untuk WO '${cleanNoWo}' sedang berlangsung.`);
    }
    closeLock.add(cleanNoWo);

    try {
      const actualDate = normalizeDateToISO(aktual_unit_selesai) || getTodayJakarta();

      // Apps Script Web App sync
      if (this.webAppUrl) {
        const res = await fetch(this.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'close_unit', no_wo: cleanNoWo, aktual_unit_selesai: actualDate }),
          redirect: 'follow',
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || 'Gagal menutup unit di Google Sheets via Web App');
        }

        const closedData: ClosedWorkOrder = cleanRowDates(json.data);
        localClosed.unshift(closedData);
        localWip = localWip.filter((w) => w.no_wo.toLowerCase() !== cleanNoWo.toLowerCase());
        return closedData;
      }

      // Fallback or Service Account flow
      const closedList = await this.getClosedList();
      const alreadyClosed = closedList.find((c) => c.no_wo.toLowerCase() === cleanNoWo.toLowerCase());
      if (alreadyClosed) {
        throw new Error(`Work Order '${cleanNoWo}' sudah tercatat di UNIT_CLOSE sebelumnya.`);
      }

      const wipList = await this.getWipList();
      const wipWo = wipList.find((w) => w.no_wo.toLowerCase() === cleanNoWo.toLowerCase());
      if (!wipWo) {
        throw new Error(`Work Order '${cleanNoWo}' tidak ditemukan di daftar WIP aktif.`);
      }

      const otd = computeOTD(actualDate, wipWo.estimasi_selesai);
      const closedAt = new Date().toISOString();

      const closedWo: ClosedWorkOrder = {
        ...wipWo,
        aktual_unit_selesai: actualDate,
        ontime_delivery: otd,
        closed_at: closedAt,
        updated_at: closedAt,
      };

      if (!this.sheets || !this.spreadsheetId) {
        localClosed.unshift(closedWo);
        localWip = localWip.filter((w) => w.no_wo.toLowerCase() !== cleanNoWo.toLowerCase());
        return closedWo;
      }

      const closedHeaderRes = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'UNIT_CLOSE!A1:V1',
      });
      const closedHeaders = (closedHeaderRes.data.values?.[0] as string[]) || UNIT_CLOSE_HEADERS;

      const appendValues = closedHeaders.map((h) => {
        const val = (closedWo as any)[h];
        return val !== undefined && val !== null ? String(val) : '';
      });

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'UNIT_CLOSE!A:A',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [appendValues] },
      });

      const verifyRes = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'UNIT_CLOSE!A1:A',
      });
      const writtenList = (verifyRes.data.values || []).map((r) => r[0]?.toString().trim().toLowerCase());
      const isWritten = writtenList.includes(cleanNoWo.toLowerCase());

      if (!isWritten) {
        throw new Error(`Gagal memverifikasi pencatatan WO '${cleanNoWo}' ke UNIT_CLOSE.`);
      }

      await this.deleteWipRowFromSheets(cleanNoWo);

      localClosed.unshift(closedWo);
      localWip = localWip.filter((w) => w.no_wo.toLowerCase() !== cleanNoWo.toLowerCase());

      return closedWo;
    } finally {
      closeLock.delete(cleanNoWo);
    }
  }

  private async deleteWipRowFromSheets(no_wo: string): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) return;

    try {
      const meta = await this.sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
      const wipSheet = meta.data.sheets?.find((s) => s.properties?.title === 'WIP');
      if (!wipSheet || wipSheet.properties?.sheetId === undefined) return;

      const sheetId = wipSheet.properties.sheetId;
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'WIP!A1:A',
      });

      const values = res.data.values || [];
      let foundIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (values[i][0]?.toString().trim().toLowerCase() === no_wo.toLowerCase()) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex !== -1) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: sheetId,
                    dimension: 'ROWS',
                    startIndex: foundIndex,
                    endIndex: foundIndex + 1,
                  },
                },
              },
            ],
          },
        });
      }
    } catch {
      // Non-fatal
    }
  }
}

export const sheetsService = new GoogleSheetsService();
