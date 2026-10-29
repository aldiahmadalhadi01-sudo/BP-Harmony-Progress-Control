/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { sheetsService } from './sheetsService.js';
import { getDashboardData, getTargetUnits } from './dashboardService.js';
import { UNIT_CLOSE_HEADERS } from '../src/types.js';

export const apiRouter = Router();

// GET /api/health
apiRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await sheetsService.getHealth();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ...health,
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: err?.message || 'Gagal memeriksa koneksi',
    });
  }
});

// GET & POST /api/config/webapp - Configure Google Apps Script Web App URL (No service account needed)
apiRouter.get('/config/webapp', (_req: Request, res: Response) => {
  res.json({ web_app_url: sheetsService.getWebAppUrl() });
});

apiRouter.post('/config/webapp', async (req: Request, res: Response) => {
  try {
    const { web_app_url } = req.body;
    if (typeof web_app_url === 'string') {
      sheetsService.setWebAppUrl(web_app_url.trim());
    }
    const health = await sheetsService.getHealth();
    res.json({
      success: health.connected_to_sheets,
      message: health.error_message || 'Berhasil menghubungkan Google Apps Script Web App!',
      health,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message });
  }
});

// POST /api/setup-sheets
apiRouter.post('/setup-sheets', async (_req: Request, res: Response) => {
  try {
    const result = await sheetsService.setupDatabase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || 'Gagal setup database Google Sheets',
    });
  }
});

// POST /api/seed-data
apiRouter.post('/seed-data', async (_req: Request, res: Response) => {
  try {
    const result = await sheetsService.seedInitialData();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || 'Gagal seed data ke Google Sheets',
    });
  }
});

// GET /api/dashboard
apiRouter.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const data = await getDashboardData();
    res.json(data);
  } catch (err: any) {
    console.error('Error in /api/dashboard:', err);
    res.status(500).json({
      error: 'Gagal memuat data dashboard',
      detail: err?.message,
    });
  }
});

// GET /api/wip
apiRouter.get('/wip', async (req: Request, res: Response) => {
  try {
    let list = await sheetsService.getWipList();
    const { q, vendor, progress, job_stopped, estimasi_selesai } = req.query;

    if (q && typeof q === 'string') {
      const lower = q.toLowerCase();
      list = list.filter(
        (item) =>
          item.no_wo.toLowerCase().includes(lower) ||
          item.no_polisi.toLowerCase().includes(lower) ||
          item.nama_customer.toLowerCase().includes(lower) ||
          item.tipe_kendaraan.toLowerCase().includes(lower) ||
          item.asuransi.toLowerCase().includes(lower)
      );
    }

    if (vendor && typeof vendor === 'string' && vendor !== 'ALL') {
      list = list.filter((item) => item.vendor === vendor);
    }

    if (progress && typeof progress === 'string' && progress !== 'ALL') {
      list = list.filter((item) => item.progress === progress);
    }

    if (job_stopped && typeof job_stopped === 'string' && job_stopped !== 'ALL') {
      list = list.filter((item) => item.job_stopped === job_stopped);
    }

    if (estimasi_selesai && typeof estimasi_selesai === 'string') {
      list = list.filter((item) => item.estimasi_selesai === estimasi_selesai);
    }

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data WIP', detail: err?.message });
  }
});

// POST /api/wip - Create new Work Order
apiRouter.post('/wip', async (req: Request, res: Response) => {
  try {
    const {
      no_wo,
      tanggal_estimasi,
      tanggal_in,
      estimasi_selesai,
      no_polisi,
      tipe_kendaraan,
      nama_customer,
      no_hp,
      asuransi,
      item_jasa,
      item_part,
      tambahan_jasa,
      tambahan_part,
      vendor,
      progress,
      job_stopped,
      keterangan,
    } = req.body;

    // Validation for required fields
    if (!no_wo || !no_wo.trim()) {
      res.status(400).json({ error: 'No WO wajib diisi.' });
      return;
    }
    if (!tanggal_in || !tanggal_in.trim()) {
      res.status(400).json({ error: 'Tanggal Masuk (tanggal_in) wajib diisi.' });
      return;
    }
    if (!estimasi_selesai || !estimasi_selesai.trim()) {
      res.status(400).json({ error: 'Target Estimasi Selesai wajib diisi.' });
      return;
    }
    if (!no_polisi || !no_polisi.trim()) {
      res.status(400).json({ error: 'Nomor Polisi wajib diisi.' });
      return;
    }
    if (!nama_customer || !nama_customer.trim()) {
      res.status(400).json({ error: 'Nama Customer wajib diisi.' });
      return;
    }

    const created = await sheetsService.createWip({
      no_wo: no_wo.trim(),
      tanggal_estimasi: tanggal_estimasi?.trim() || tanggal_in.trim(),
      tanggal_in: tanggal_in.trim(),
      estimasi_selesai: estimasi_selesai.trim(),
      no_polisi: no_polisi.trim().toUpperCase(),
      tipe_kendaraan: tipe_kendaraan?.trim() || '-',
      nama_customer: nama_customer.trim(),
      no_hp: no_hp?.trim() || '-',
      asuransi: asuransi?.trim() || 'UMUM',
      item_jasa: item_jasa?.trim() || '',
      item_part: item_part?.trim() || '',
      tambahan_jasa: tambahan_jasa?.trim() || '',
      tambahan_part: tambahan_part?.trim() || '',
      vendor: vendor?.trim() || 'Bengkel Internal (Main Shop)',
      progress: progress?.trim() || 'Bongkar',
      job_stopped: job_stopped === 'YA' ? 'YA' : 'TIDAK',
      keterangan: keterangan?.trim() || '',
    });

    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Gagal menyimpan Work Order baru.' });
  }
});

// GET /api/wip/:no_wo
apiRouter.get('/wip/:no_wo', async (req: Request, res: Response) => {
  try {
    const { no_wo } = req.params;
    const result = await sheetsService.findByNoWo(no_wo);
    if (!result.item) {
      res.status(404).json({ error: `Work Order '${no_wo}' tidak ditemukan.` });
      return;
    }
    res.json(result.item);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil detail WO', detail: err?.message });
  }
});

// PUT /api/wip/:no_wo
apiRouter.put('/wip/:no_wo', async (req: Request, res: Response) => {
  try {
    const { no_wo } = req.params;
    const updates = req.body;

    const updated = await sheetsService.updateWip(no_wo, updates);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Gagal memperbarui Work Order.' });
  }
});

// POST /api/wip/:no_wo/close - Close Unit flow
apiRouter.post('/wip/:no_wo/close', async (req: Request, res: Response) => {
  try {
    const { no_wo } = req.params;
    const { aktual_unit_selesai } = req.body;

    if (!aktual_unit_selesai || !aktual_unit_selesai.trim()) {
      res.status(400).json({ error: 'Tanggal Aktual Selesai wajib diisi untuk menutup unit.' });
      return;
    }

    const closed = await sheetsService.closeUnit(no_wo, aktual_unit_selesai.trim());
    res.json({
      success: true,
      message: `Unit '${no_wo}' berhasil ditutup (OTD: ${closed.ontime_delivery}).`,
      data: closed,
    });
  } catch (err: any) {
    console.error('Error closing WO:', err);
    res.status(400).json({
      success: false,
      error: err?.message || 'Gagal melakukan transaksi Unit Close.',
    });
  }
});

// GET /api/unit-close
apiRouter.get('/unit-close', async (req: Request, res: Response) => {
  try {
    let list = await sheetsService.getClosedList();
    const { q, vendor, otd, aktual_unit_selesai } = req.query;

    if (q && typeof q === 'string') {
      const lower = q.toLowerCase();
      list = list.filter(
        (item) =>
          item.no_wo.toLowerCase().includes(lower) ||
          item.no_polisi.toLowerCase().includes(lower) ||
          item.nama_customer.toLowerCase().includes(lower) ||
          item.tipe_kendaraan.toLowerCase().includes(lower)
      );
    }

    if (vendor && typeof vendor === 'string' && vendor !== 'ALL') {
      list = list.filter((item) => item.vendor === vendor);
    }

    if (otd && typeof otd === 'string' && otd !== 'ALL') {
      list = list.filter((item) => item.ontime_delivery === otd);
    }

    if (aktual_unit_selesai && typeof aktual_unit_selesai === 'string') {
      list = list.filter((item) => item.aktual_unit_selesai === aktual_unit_selesai);
    }

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data Unit Close', detail: err?.message });
  }
});

// GET /api/target-selesai
apiRouter.get('/target-selesai', async (_req: Request, res: Response) => {
  try {
    const list = await getTargetUnits();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengambil data Target Selesai', detail: err?.message });
  }
});

// GET /api/export/unit-close (CSV export)
apiRouter.get('/export/unit-close', async (_req: Request, res: Response) => {
  try {
    const list = await sheetsService.getClosedList();

    // Generate CSV string
    const headers = [...UNIT_CLOSE_HEADERS];
    const headerRow = headers.join(',');

    const rows = list.map((item) => {
      return headers
        .map((h) => {
          let val = (item as any)[h] ?? '';
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',');
    });

    const csvContent = [headerRow, ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="BPMS_UNIT_CLOSE_${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal export data', detail: err?.message });
  }
});
