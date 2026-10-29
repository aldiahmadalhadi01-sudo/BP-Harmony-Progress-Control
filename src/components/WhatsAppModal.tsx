/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WorkOrder, ClosedWorkOrder } from '../types';
import { Modal } from './Modal';
import {
  generateWaMessage,
  normalizePhoneForWa,
  buildWaUrl,
  WaTemplateType,
} from '../utils/whatsappHelper';
import {
  MessageSquare,
  Copy,
  Check,
  Send,
  Phone,
  Sparkles,
  Car,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrder | ClosedWorkOrder | null;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  workOrder,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<WaTemplateType>('progress');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (workOrder) {
      setPhoneInput(workOrder.no_hp || '');

      // Auto pick suitable initial template
      let defaultType: WaTemplateType = 'progress';
      if ('closed_at' in workOrder && (workOrder as ClosedWorkOrder).closed_at) {
        defaultType = 'ready';
      } else if (workOrder.job_stopped === 'YA') {
        defaultType = 'job_stopped';
      } else if (workOrder.progress === 'Cuci & Siap Delivery') {
        defaultType = 'ready';
      }

      setSelectedTemplate(defaultType);
      setCustomMessage(generateWaMessage(workOrder, defaultType));
      setCopied(false);
    }
  }, [workOrder]);

  if (!workOrder) return null;

  const handleTemplateChange = (type: WaTemplateType) => {
    setSelectedTemplate(type);
    setCustomMessage(generateWaMessage(workOrder, type));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normPhone = normalizePhoneForWa(phoneInput);
  const waUrl = buildWaUrl(phoneInput, customMessage);
  const isValidPhone = normPhone.length >= 10;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Follow Up Pelanggan via WhatsApp"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Unit & Customer Header Banner */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-300 text-xs">
                {workOrder.no_wo}
              </span>
              <span className="font-bold text-slate-800 text-sm">{workOrder.no_polisi}</span>
              <span className="text-xs text-slate-500">({workOrder.tipe_kendaraan})</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Customer: <strong>{workOrder.nama_customer}</strong> • Asuransi: {workOrder.asuransi || 'UMUM'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-emerald-800 block">Progress Saat Ini:</span>
            <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
              {workOrder.progress}
            </span>
          </div>
        </div>

        {/* Customer Phone Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-600" />
              Nomor WhatsApp Tujuan *
            </span>
            <span className="text-[11px] font-normal text-slate-500">
              Format internasional: {normPhone ? `+${normPhone}` : '(Belum valid)'}
            </span>
          </label>
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="Contoh: 081234567890 atau 6281234567890"
            className="w-full px-3.5 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          {!isValidPhone && phoneInput.trim() !== '' && (
            <p className="text-xs text-rose-600 mt-1">
              Nomor handphone kurang dari 10 digit. Periksa kembali nomor customer.
            </p>
          )}
        </div>

        {/* Template Quick Selectors */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Pilih Template Pesan Otomatis:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleTemplateChange('progress')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedTemplate === 'progress'
                  ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Update Progres
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Status panel saat ini</span>
            </button>

            <button
              type="button"
              onClick={() => handleTemplateChange('ready')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedTemplate === 'ready'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Car className="w-3.5 h-3.5 text-emerald-600" />
                Siap Diambil
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Unit selesai & QC</span>
            </button>

            <button
              type="button"
              onClick={() => handleTemplateChange('job_stopped')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedTemplate === 'job_stopped'
                  ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Job Stopped
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Info kendala / inden</span>
            </button>

            <button
              type="button"
              onClick={() => handleTemplateChange('reminder')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedTemplate === 'reminder'
                  ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Pengingat Target
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Info jadwal estimasi</span>
            </button>
          </div>
        </div>

        {/* Message Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Isi Pesan WhatsApp (Dapat Diedit Langsung)
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Pesan Tersalin!' : 'Salin Teks'}
            </button>
          </div>
          <textarea
            rows={7}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full p-3.5 text-xs font-sans border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed bg-slate-50/50"
            placeholder="Tulis pesan untuk customer..."
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Gunakan tanda bintang (*) untuk membuat teks tebal di WhatsApp.
          </p>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin!' : 'Salin Pesan'}
            </button>

            {isValidPhone ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Buka WhatsApp & Kirim
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-400 rounded-lg opacity-60 cursor-not-allowed"
                title="Nomor handphone customer belum diisi"
              >
                <Send className="w-3.5 h-3.5" />
                Buka WhatsApp (Isi No HP)
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
