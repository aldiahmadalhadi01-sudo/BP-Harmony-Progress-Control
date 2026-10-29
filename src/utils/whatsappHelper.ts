/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkOrder, ClosedWorkOrder } from '../types';
import { formatDateIndo } from './dateHelper';

/**
 * Normalizes Indonesian phone number to international format (628xxx)
 */
export function normalizePhoneForWa(phone?: string): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, ''); // strip non-digits

  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  } else if (clean.startsWith('62')) {
    // already 62
  }

  return clean;
}

export type WaTemplateType = 'progress' | 'ready' | 'job_stopped' | 'reminder' | 'custom';

export function generateWaMessage(
  wo: WorkOrder | ClosedWorkOrder,
  templateType: WaTemplateType
): string {
  const customerName = wo.nama_customer || 'Pelanggan';
  const nopol = wo.no_polisi || '-';
  const tipe = wo.tipe_kendaraan || 'Kendaraan';
  const noWo = wo.no_wo || '-';
  const progress = wo.progress || 'Dalam Pengerjaan';
  const estimasi = formatDateIndo(wo.estimasi_selesai);
  const keterangan = wo.keterangan ? `\n📝 *Catatan:* ${wo.keterangan}` : '';

  switch (templateType) {
    case 'ready':
      return `Kabar Baik dari BYD Workshop! 🚗⚡✨\n\nHalo Bpk/Ibu *${customerName}*,\nKendaraan Anda *${nopol}* (${tipe}) dengan No. WO *${noWo}* telah selesai proses pengerjaan di Bengkel Body Repair & Paint BYD.\n\nUnit telah melewati tahap pemeriksaan mutu (QC) & pembersihan akhir, dan saat ini *SIAP UNTUK DIAMBIL / DELIVERY* di bengkel kami.\n\nSilakan konfirmasi jadwal kedatangan Bpk/Ibu. Terima kasih atas kepercayaan Anda pada layanan BYD!`;

    case 'job_stopped':
      return `Pemberitahuan Operasional BYD Workshop ⚠️\n\nHalo Bpk/Ibu *${customerName}*,\nKami menginformasikan bahwa pengerjaan kendaraan *${nopol}* (${tipe}) No. WO *${noWo}* saat ini mengalami penundaan sementara (*Job Stopped*):\n\n🔍 *Kendala / Alasan:* ${wo.keterangan || 'Menunggu konfirmasi part / persetujuan tambahan'}\n\nTim Service Advisor BYD kami siap berkoordinasi lebih lanjut agar proses pengerjaan dapat segera dilanjutkan kembali. Terima kasih.`;

    case 'reminder':
      return `Halo Bpk/Ibu *${customerName}*,\n\nKami menginformasikan bahwa perbaikan kendaraan *${nopol}* (${tipe}) No. WO *${noWo}* ditargetkan selesai pada *${estimasi}*.\n\nSaat ini kendaraan berada di tahap *${progress}*. Tim teknisi BYD kami sedang memaksimalkan proses pengerjaan agar unit selesai tepat waktu.\n\nTerima kasih atas kepercayaannya.`;

    case 'progress':
    default:
      return `Halo Bpk/Ibu *${customerName}*,\n\nKami dari *BYD Body & Paint Workshop (Progress Control System)* menginformasikan update progres perbaikan kendaraan Anda:\n\n🚗 *Kendaraan:* ${tipe} (*${nopol}*)\n📋 *No. WO:* ${noWo}\n🔧 *Tahap Pengerjaan:* ${progress}\n📅 *Target Selesai:* ${estimasi}${keterangan}\n\nKami akan terus mengabarkan perkembangan pengerjaan unit Anda. Terima kasih!`;
  }
}

export function buildWaUrl(phone: string, message: string): string {
  const normPhone = normalizePhoneForWa(phone);
  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${normPhone}&text=${encodedText}`;
}
