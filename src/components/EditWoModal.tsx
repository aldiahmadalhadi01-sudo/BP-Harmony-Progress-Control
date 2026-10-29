/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkOrder, DEFAULT_PROGRESS_OPTIONS, DEFAULT_VENDORS } from '../types';
import { Modal } from './Modal';
import { api } from '../api/client';
import { Save, Loader2, AlertCircle } from 'lucide-react';

interface EditWoModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | null;
  onSuccess: (updated: WorkOrder) => void;
}

export const EditWoModal: React.FC<EditWoModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Partial<WorkOrder>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workOrder) {
      setFormData({
        estimasi_selesai: workOrder.estimasi_selesai,
        tipe_kendaraan: workOrder.tipe_kendaraan,
        nama_customer: workOrder.nama_customer,
        no_hp: workOrder.no_hp,
        asuransi: workOrder.asuransi,
        vendor: workOrder.vendor,
        progress: workOrder.progress,
        job_stopped: workOrder.job_stopped,
        item_jasa: workOrder.item_jasa,
        item_part: workOrder.item_part,
        tambahan_jasa: workOrder.tambahan_jasa,
        tambahan_part: workOrder.tambahan_part,
        keterangan: workOrder.keterangan,
      });
      setError(null);
    }
  }, [workOrder]);

  if (!workOrder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.estimasi_selesai) {
      setError('Target Estimasi Selesai wajib diisi.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updated = await api.updateWip(workOrder.no_wo, formData);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Work Order: ${workOrder.no_wo}`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Readonly identity */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block">Nomor WO (Kunci Utama):</span>
            <span className="font-bold text-slate-800 text-sm">{workOrder.no_wo}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Nomor Polisi:</span>
            <span className="font-mono font-bold text-slate-800 text-sm">{workOrder.no_polisi}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Estimasi Selesai *
            </label>
            <input
              type="date"
              required
              value={formData.estimasi_selesai || ''}
              onChange={(e) => setFormData({ ...formData, estimasi_selesai: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Progress Pengerjaan
            </label>
            <select
              value={formData.progress || ''}
              onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              {DEFAULT_PROGRESS_OPTIONS.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Job Stopped (Penghentian Pekerjaan)
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
                YA (Pekerjaan Terhenti)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Vendor Pengerjaan
            </label>
            <select
              value={formData.vendor || ''}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              {DEFAULT_VENDORS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Item Jasa
            </label>
            <textarea
              rows={2}
              value={formData.item_jasa || ''}
              onChange={(e) => setFormData({ ...formData, item_jasa: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Rincian perbaikan panel/jasa..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Item Part / Sparepart
            </label>
            <textarea
              rows={2}
              value={formData.item_part || ''}
              onChange={(e) => setFormData({ ...formData, item_part: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Rincian sparepart..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tambahan Jasa (Jika ada)
            </label>
            <textarea
              rows={2}
              value={formData.tambahan_jasa || ''}
              onChange={(e) => setFormData({ ...formData, tambahan_jasa: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Jasa susulan / tambahan..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tambahan Part (Jika ada)
            </label>
            <textarea
              rows={2}
              value={formData.tambahan_part || ''}
              onChange={(e) => setFormData({ ...formData, tambahan_part: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Part susulan..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Keterangan / Alasan Job Stopped
          </label>
          <textarea
            rows={2}
            value={formData.keterangan || ''}
            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Catatan pengerjaan atau kendala sparepart..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
