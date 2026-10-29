/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WorkOrder, ClosedWorkOrder } from '../types';
import { Modal } from './Modal';
import { formatDateIndo, calculateDaysDiff, getTargetCategory, formatDaysRemaining } from '../utils/dateHelper';
import { TargetStatusBadge, OtdBadge, JobStoppedBadge, ProgressBadge } from './StatusBadges';
import { Car, User, Phone, Shield, Wrench, Calendar, FileText, CheckCircle2, MessageSquare } from 'lucide-react';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WorkOrder | ClosedWorkOrder | null;
  onFollowUpWa?: (wo: WorkOrder | ClosedWorkOrder) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, data, onFollowUpWa }) => {
  if (!data) return null;

  const isClosed = 'closed_at' in data && Boolean((data as ClosedWorkOrder).closed_at);
  const closedData = data as ClosedWorkOrder;
  const daysDiff = calculateDaysDiff(data.estimasi_selesai);
  const targetCategory = getTargetCategory(daysDiff);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Work Order: ${data.no_wo}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase">Nomor WO</span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{data.no_wo}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block bg-slate-900 text-white font-mono font-bold text-sm px-2.5 py-0.5 rounded shadow-xs">
                {data.no_polisi}
              </span>
              <span className="text-sm font-medium text-slate-600">{data.tipe_kendaraan}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {isClosed ? (
              <div className="flex flex-col items-end gap-1">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  UNIT CLOSE
                </span>
                <OtdBadge otd={closedData.ontime_delivery} />
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <TargetStatusBadge status={targetCategory} />
                  <JobStoppedBadge stopped={data.job_stopped} />
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {formatDaysRemaining(daysDiff)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Customer & Vehicle Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" /> Informasi Customer & Asuransi
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400 block text-xs">Nama Customer</span>
                <span className="font-semibold text-slate-800">{data.nama_customer || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">No. Handphone</span>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {data.no_hp || '-'}
                  </span>
                  {onFollowUpWa && (
                    <button
                      type="button"
                      onClick={() => onFollowUpWa(data)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors cursor-pointer"
                      title="Follow up WhatsApp"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      Chat WA
                    </button>
                  )}
                </div>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-100">
                <span className="text-slate-400 block text-xs">Asuransi / Pembayar</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  {data.asuransi || 'UMUM'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" /> Timeline & Pengerjaan
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400 block text-xs">Tanggal Masuk (In)</span>
                <span className="font-semibold text-slate-800">{formatDateIndo(data.tanggal_in)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Target Selesai</span>
                <span className="font-semibold text-slate-800">{formatDateIndo(data.estimasi_selesai)}</span>
              </div>
              {isClosed && (
                <>
                  <div className="pt-1 border-t border-slate-100">
                    <span className="text-slate-400 block text-xs">Aktual Selesai</span>
                    <span className="font-bold text-emerald-700">{formatDateIndo(closedData.aktual_unit_selesai)}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <span className="text-slate-400 block text-xs">Hasil Pengiriman</span>
                    <span className="font-bold">{closedData.ontime_delivery === 'YA' ? 'Tepat Waktu (OTD YA)' : 'Terlambat (OTD TIDAK)'}</span>
                  </div>
                </>
              )}
              <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-xs">Vendor</span>
                  <span className="font-semibold text-slate-800">{data.vendor || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Progress</span>
                  <ProgressBadge progress={data.progress} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Stopped Warning if applicable */}
        {data.job_stopped === 'YA' && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-2.5">
            <JobStoppedBadge stopped="YA" />
            <div className="flex-1">
              <p className="font-bold">Unit Sedang Dihentikan (Job Stopped)!</p>
              <p className="text-xs text-rose-700 mt-0.5">{data.keterangan || 'Tidak ada catatan spesifik.'}</p>
            </div>
          </div>
        )}

        {/* Scope of Work: Jasa and Parts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-slate-500" /> Item Jasa
              </h4>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm whitespace-pre-line text-slate-700 min-h-[70px]">
              {data.item_jasa ? data.item_jasa : <span className="text-slate-400 italic">Tidak ada item jasa</span>}
            </div>

            {data.tambahan_jasa && (
              <div className="pt-2">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
                  Tambahan Jasa
                </span>
                <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 text-xs whitespace-pre-line text-amber-900">
                  {data.tambahan_jasa}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-4 h-4 text-slate-500" /> Item Part / Sparepart
              </h4>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm whitespace-pre-line text-slate-700 min-h-[70px]">
              {data.item_part ? data.item_part : <span className="text-slate-400 italic">Tidak ada item part</span>}
            </div>

            {data.tambahan_part && (
              <div className="pt-2">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
                  Tambahan Part
                </span>
                <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 text-xs whitespace-pre-line text-amber-900">
                  {data.tambahan_part}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Keterangan */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <FileText className="w-4 h-4 text-slate-400" /> Catatan / Keterangan Operasional
          </h4>
          <p className="text-sm text-slate-700 whitespace-pre-line">
            {data.keterangan || <span className="text-slate-400 italic">Tidak ada catatan</span>}
          </p>
        </div>

        {/* WhatsApp Follow Up Action Banner */}
        {onFollowUpWa && (
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-800 block">Follow Up Pelanggan via WhatsApp</span>
                <span className="text-[11px] text-slate-500">Kirim update progres, konfirmasi, atau kabar unit selesai dalam 1 klik</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onFollowUpWa(data)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Kirim WhatsApp
            </button>
          </div>
        )}

        {/* Footer Audit Timestamps */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
          <div>Dibuat: {data.created_at ? new Date(data.created_at).toLocaleString('id-ID') : '-'}</div>
          <div>Terakhir Diperbarui: {data.updated_at ? new Date(data.updated_at).toLocaleString('id-ID') : '-'}</div>
          {isClosed && <div>Ditutup: {new Date(closedData.closed_at).toLocaleString('id-ID')}</div>}
        </div>
      </div>
    </Modal>
  );
};
