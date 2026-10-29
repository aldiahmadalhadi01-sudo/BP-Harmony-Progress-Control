/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkOrder, ClosedWorkOrder } from '../types';
import { Modal } from './Modal';
import { api } from '../api/client';
import { getTodayJakarta, formatDateIndo, computeOTD, calculateDaysDiff } from '../utils/dateHelper';
import { CheckCircle2, AlertCircle, Calendar, Car, User, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CloseWoModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
  onSuccess: (closedData: ClosedWorkOrder) => void;
}

export const CloseWoModal: React.FC<CloseWoModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  onSuccess,
}) => {
  const [aktualSelesai, setAktualSelesai] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workOrder) {
      setAktualSelesai(getTodayJakarta());
      setError(null);
    }
  }, [workOrder]);

  if (!workOrder) return null;

  const previewOtd = aktualSelesai
    ? computeOTD(aktualSelesai, workOrder.estimasi_selesai)
    : 'TIDAK';

  const daysLate = aktualSelesai
    ? calculateDaysDiff(workOrder.estimasi_selesai, aktualSelesai)
    : 0;

  const handleConfirmClose = async () => {
    if (!aktualSelesai) {
      setError('Tanggal aktual unit selesai wajib diisi.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.closeUnit(workOrder.no_wo, aktualSelesai);

      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      onSuccess(response.data);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menutup Work Order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Penutupan Unit (Unit Close)"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identitas WO</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
              {workOrder.no_wo}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-bold text-slate-800 text-sm">{workOrder.no_polisi}</span>
            <span className="text-slate-500 text-xs">({workOrder.tipe_kendaraan})</span>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-700 text-xs">Customer: <strong>{workOrder.nama_customer}</strong></span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">Target Estimasi Selesai:</span>
            <span className="font-bold text-slate-800">{formatDateIndo(workOrder.estimasi_selesai)}</span>
          </div>
        </div>

        {/* Date Picker for Aktual Selesai */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            Tanggal Aktual Unit Selesai *
          </label>
          <input
            type="date"
            required
            value={aktualSelesai}
            onChange={(e) => setAktualSelesai(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-xs text-slate-400 mt-1">
            Default tanggal hari ini zona waktu Asia/Jakarta ({formatDateIndo(getTodayJakarta())})
          </p>
        </div>

        {/* Dynamic OTD Preview Box */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            previewOtd === 'YA'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Prediksi Indikator OTD
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black inline-flex items-center gap-1 ${
                previewOtd === 'YA'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {previewOtd === 'YA' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  OTD: YA (TEPAT WAKTU)
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  OTD: TIDAK (TERLAMBAT)
                </>
              )}
            </span>
          </div>
          <p className="text-xs leading-relaxed">
            {previewOtd === 'YA'
              ? 'Unit diselesaikan pada atau sebelum tanggal estimasi selesai. Tercatat sebagai On-Time Delivery.'
              : `Unit diselesaikan melewati target estimasi selesai (${Math.abs(daysLate)} hari terlambat).`}
          </p>
        </div>

        <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-xs text-amber-800 leading-normal">
          <strong>Catatan Transaksi:</strong> Data WO ini akan dipindahkan secara permanen ke worksheet <strong>UNIT_CLOSE</strong> dan dihapus dari daftar aktif WIP setelah verifikasi berhasil.
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmClose}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memproses Penutupan...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Konfirmasi & Tutup Unit
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
