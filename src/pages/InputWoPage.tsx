/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkOrder, DEFAULT_PROGRESS_OPTIONS, DEFAULT_VENDORS, DEFAULT_VEHICLE_TYPES } from '../types';
import { api } from '../api/client';
import { getTodayJakarta } from '../utils/dateHelper';
import {
  FilePlus2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Car,
  User,
  Calendar,
  Wrench,
  Shield,
  Loader2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InputWoPageProps {
  onSuccessCreated: (newWo: WorkOrder) => void;
  onNavigateToWip: () => void;
}

export const InputWoPage: React.FC<InputWoPageProps> = ({
  onSuccessCreated,
  onNavigateToWip,
}) => {
  const today = getTodayJakarta();

  // Initial form state
  const initialFormState: Partial<WorkOrder> = {
    no_wo: '',
    tanggal_estimasi: today,
    tanggal_in: today,
    estimasi_selesai: '',
    no_polisi: '',
    tipe_kendaraan: '',
    nama_customer: '',
    no_hp: '',
    asuransi: 'Asuransi Astra (Garda Oto)',
    item_jasa: '',
    item_part: '',
    tambahan_jasa: '',
    tambahan_part: '',
    vendor: 'Internal',
    progress: 'Bongkar',
    job_stopped: 'TIDAK',
    keterangan: '',
  };

  const [formData, setFormData] = useState<Partial<WorkOrder>>(initialFormState);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ no_wo: string } | null>(null);

  // Generate suggested next WO number helper
  const handleGenerateWoNumber = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    setFormData((prev) => ({
      ...prev,
      no_wo: `WO-${year}-${randomDigits}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    // Validate required fields
    if (!formData.no_wo || !formData.no_wo.trim()) {
      setErrorMessage('Nomor Work Order (No WO) wajib diisi.');
      return;
    }
    if (!formData.tanggal_in || !formData.tanggal_in.trim()) {
      setErrorMessage('Tanggal Masuk (Tanggal In) wajib diisi.');
      return;
    }
    if (!formData.estimasi_selesai || !formData.estimasi_selesai.trim()) {
      setErrorMessage('Target Estimasi Selesai wajib diisi.');
      return;
    }
    if (!formData.no_polisi || !formData.no_polisi.trim()) {
      setErrorMessage('Nomor Polisi wajib diisi.');
      return;
    }
    if (!formData.nama_customer || !formData.nama_customer.trim()) {
      setErrorMessage('Nama Customer wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const created = await api.createWip(formData);

      // Play confetti on successful creation
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }

      setSuccessInfo({ no_wo: created.no_wo });
      onSuccessCreated(created);

      // Reset form
      setFormData({
        ...initialFormState,
        tanggal_estimasi: getTodayJakarta(),
        tanggal_in: getTodayJakarta(),
      });
    } catch (err: any) {
      // Retain user input and display clear error message
      setErrorMessage(err?.message || 'Gagal menyimpan Work Order baru.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setErrorMessage(null);
    setSuccessInfo(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-blue-600" />
            Pendaftaran Work Order (WO) Baru
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pastikan seluruh data tervalidasi sebelum masuk ke daftar aktif Work In Progress (WIP)
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerateWoNumber}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          Generate No. WO Otomatis
        </button>
      </div>

      {/* Success Notification Alert */}
      {successInfo && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">
                Work Order {successInfo.no_wo} Berhasil Disimpan ke Worksheet WIP!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Data telah tersinkronisasi dan dapat langsung dipantau di daftar Unit WIP dan Target Selesai.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToWip}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Lihat di WIP
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-3 animate-fade-in shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm">Gagal Menyimpan Work Order</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identitas WO & Kendaraan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Car className="w-4 h-4 text-blue-600" /> Identitas Work Order & Kendaraan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                No. Work Order *
              </label>
              <input
                type="text"
                required
                value={formData.no_wo || ''}
                onChange={(e) => setFormData({ ...formData, no_wo: e.target.value })}
                placeholder="Contoh: WO-2026-1010"
                className="w-full px-3.5 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Wajib unik di seluruh database</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor Polisi *
              </label>
              <input
                type="text"
                required
                value={formData.no_polisi || ''}
                onChange={(e) => setFormData({ ...formData, no_polisi: e.target.value.toUpperCase() })}
                placeholder="Contoh: B 1234 ABC"
                className="w-full px-3.5 py-2 text-sm font-bold font-mono uppercase border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Disimpan sebagai teks</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipe Kendaraan / Model
              </label>
              <input
                type="text"
                value={formData.tipe_kendaraan || ''}
                onChange={(e) => setFormData({ ...formData, tipe_kendaraan: e.target.value })}
                placeholder="Contoh: BYD Seal Performance / Atto 3 / M6"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {DEFAULT_VEHICLE_TYPES.map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setFormData({ ...formData, tipe_kendaraan: model })}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 border border-slate-200 cursor-pointer transition-colors font-medium"
                  >
                    + {model}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Informasi Customer & Asuransi */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-blue-600" /> Informasi Customer & Asuransi
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Customer *
              </label>
              <input
                type="text"
                required
                value={formData.nama_customer || ''}
                onChange={(e) => setFormData({ ...formData, nama_customer: e.target.value })}
                placeholder="Nama pemilik / penanggung jawab"
                className="w-full px-3.5 py-2 text-sm font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor Handphone (WhatsApp)
              </label>
              <input
                type="tel"
                value={formData.no_hp || ''}
                onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                placeholder="0812xxxxxxxx"
                className="w-full px-3.5 py-2 text-sm font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Asuransi / Pembayar
              </label>
              <input
                type="text"
                value={formData.asuransi || ''}
                onChange={(e) => setFormData({ ...formData, asuransi: e.target.value })}
                placeholder="Contoh: Asuransi Astra / UMUM"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Timeline & Jadwal Pengerjaan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-4 h-4 text-blue-600" /> Timeline & Estimasi Waktu
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Estimasi
              </label>
              <input
                type="date"
                value={formData.tanggal_estimasi || ''}
                onChange={(e) => setFormData({ ...formData, tanggal_estimasi: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Masuk (In) *
              </label>
              <input
                type="date"
                required
                value={formData.tanggal_in || ''}
                onChange={(e) => setFormData({ ...formData, tanggal_in: e.target.value })}
                className="w-full px-3.5 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Estimasi Selesai *
              </label>
              <input
                type="date"
                required
                value={formData.estimasi_selesai || ''}
                onChange={(e) => setFormData({ ...formData, estimasi_selesai: e.target.value })}
                className="w-full px-3.5 py-2 text-sm font-bold text-blue-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Digunakan untuk kalkulasi OTD</span>
            </div>
          </div>
        </div>

        {/* Section 4: Operasional, Vendor, Progress & Job Stopped */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Wrench className="w-4 h-4 text-blue-600" /> Operasional Bengkel & Status
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vendor Pengerjaan
              </label>
              <select
                value={formData.vendor || ''}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {DEFAULT_VENDORS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status Progress
              </label>
              <select
                value={formData.progress || ''}
                onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold"
              >
                {DEFAULT_PROGRESS_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Job Stopped (Penghentian Kerja)
              </label>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="job_stopped"
                    value="TIDAK"
                    checked={formData.job_stopped === 'TIDAK'}
                    onChange={() => setFormData({ ...formData, job_stopped: 'TIDAK' })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  TIDAK (Normal)
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-rose-600 cursor-pointer">
                  <input
                    type="radio"
                    name="job_stopped"
                    value="YA"
                    checked={formData.job_stopped === 'YA'}
                    onChange={() => setFormData({ ...formData, job_stopped: 'YA' })}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  YA (Terhenti)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Rincian Jasa & Part (Separate Columns) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-blue-600" /> Rincian Jasa & Part (Kolom Terpisah)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Item Jasa (Gunakan baris baru untuk multi-item)
              </label>
              <textarea
                rows={3}
                value={formData.item_jasa || ''}
                onChange={(e) => setFormData({ ...formData, item_jasa: e.target.value })}
                placeholder="Contoh:&#10;Ketok kap mesin&#10;Cat oven fender depan kanan"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Item Part (Gunakan baris baru untuk multi-item)
              </label>
              <textarea
                rows={3}
                value={formData.item_part || ''}
                onChange={(e) => setFormData({ ...formData, item_part: e.target.value })}
                placeholder="Contoh:&#10;Lampu headlamp kiri&#10;Klip bumper (4 pcs)"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tambahan Jasa (Jika ada perbaikan susulan)
              </label>
              <textarea
                rows={2}
                value={formData.tambahan_jasa || ''}
                onChange={(e) => setFormData({ ...formData, tambahan_jasa: e.target.value })}
                placeholder="Perbaikan jasa tambahan..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tambahan Part (Jika ada part susulan)
              </label>
              <textarea
                rows={2}
                value={formData.tambahan_part || ''}
                onChange={(e) => setFormData({ ...formData, tambahan_part: e.target.value })}
                placeholder="Sparepart tambahan..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Keterangan Operasional / Catatan Tambahan
            </label>
            <textarea
              rows={2}
              value={formData.keterangan || ''}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder="Catatan pengerjaan khusus, permintaan customer, atau kendala..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Reset Form
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan ke Database...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Simpan Work Order ke WIP
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
