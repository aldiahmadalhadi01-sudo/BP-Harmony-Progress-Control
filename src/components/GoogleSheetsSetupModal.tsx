/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '../api/client';
import { WIP_HEADERS, UNIT_CLOSE_HEADERS } from '../types';
import { APPS_SCRIPT_CODE } from '../utils/appsScriptCode';
import {
  Check,
  Copy,
  ExternalLink,
  Table,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Link2,
  Sparkles,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

interface GoogleSheetsSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusRefresh?: () => void;
}

export const GoogleSheetsSetupModal: React.FC<GoogleSheetsSetupModalProps> = ({
  isOpen,
  onClose,
  onStatusRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'webapp' | 'template' | 'serviceaccount'>('webapp');

  // Web App URL state
  const [webAppUrlInput, setWebAppUrlInput] = useState('');
  const [savingWebApp, setSavingWebApp] = useState(false);
  const [webAppResult, setWebAppResult] = useState<{ success: boolean; message: string } | null>(null);

  // Copy states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedWip, setCopiedWip] = useState(false);
  const [copiedClose, setCopiedClose] = useState(false);

  // Testing states
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    mode: string;
    method?: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getWebAppUrl().then((res) => {
        if (res.web_app_url) setWebAppUrlInput(res.web_app_url);
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const copyToClipboard = (text: string, isWip: boolean) => {
    navigator.clipboard.writeText(text);
    if (isWip) {
      setCopiedWip(true);
      setTimeout(() => setCopiedWip(false), 2000);
    } else {
      setCopiedClose(true);
      setTimeout(() => setCopiedClose(false), 2000);
    }
  };

  const handleSaveWebAppUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webAppUrlInput.trim()) {
      setWebAppResult({ success: false, message: 'Masukkan URL Web App Google Apps Script.' });
      return;
    }

    setSavingWebApp(true);
    setWebAppResult(null);

    try {
      const res = await api.saveWebAppUrl(webAppUrlInput.trim());
      setWebAppResult({
        success: res.success,
        message: res.message || (res.success ? 'Berhasil terhubung ke Google Sheets!' : 'Koneksi gagal diperiksa.'),
      });
      if (onStatusRefresh) onStatusRefresh();
    } catch (err: any) {
      setWebAppResult({
        success: false,
        message: err?.message || 'Gagal menyimpan URL Web App.',
      });
    } finally {
      setSavingWebApp(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.getHealth();
      setTestResult({
        connected: res.connected_to_sheets,
        mode: res.mode,
        method: res.method,
        message:
          res.error_message ||
          (res.connected_to_sheets
            ? `Koneksi Berhasil! Terhubung ke Google Sheets (${res.wip_rows_count} WIP, ${res.closed_rows_count} Unit Close).`
            : 'Belum terhubung ke spreadsheet.'),
      });
      if (onStatusRefresh) onStatusRefresh();
    } catch (err: any) {
      setTestResult({
        connected: false,
        mode: 'ERROR',
        message: err?.message || 'Gagal menghubungi server.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sinkronisasi & Setup Database Google Sheets"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Connection Status Box */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Status Koneksi Spreadsheet
              </span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                Cek apakah aplikasi saat ini tersambung ke Google Sheets atau masih mode demo lokal.
              </p>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              Uji Koneksi Sekarang
            </button>
          </div>

          {testResult && (
            <div
              className={`mt-3 p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 ${
                testResult.connected
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-900'
              }`}
            >
              {testResult.connected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">
                  {testResult.connected
                    ? `Terhubung ke Google Sheets (${testResult.method === 'WEB_APP_URL' ? 'Web App' : 'Service Account'})`
                    : `Mode: ${testResult.mode}`}
                </p>
                <p className="mt-0.5">{testResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('webapp')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'webapp'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Tanpa Service Account (Apps Script Web App)
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-extrabold">
              Paling Cepat
            </span>
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'template'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Download File Excel (.xlsx)
          </button>

          <button
            onClick={() => setActiveTab('serviceaccount')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'serviceaccount'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Google Service Account (Vercel)
          </button>
        </div>

        {/* TAB 1: APPS SCRIPT WEB APP (NO SERVICE ACCOUNT) */}
        {activeTab === 'webapp' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Cara Menghubungkan Google Sheets Tanpa Google Cloud Service Account
              </h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                Anda tidak perlu membuat project di Google Cloud Console ataupun mengunduh private key JSON.
                Cukup pasang <strong>Google Apps Script Web App</strong> di dalam spreadsheet Google Sheets Anda:
              </p>
            </div>

            {/* Steps */}
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
              <li>
                Buka file Google Sheets Anda (misal: spreadsheet kosong atau <strong>BPMS_WO_DATABASE</strong>).
              </li>
              <li>
                Klik menu <strong>Ekstensi (Extensions) &gt; Apps Script</strong> di Google Sheets.
                {/* Multi-account trouble hint */}
                <div className="my-2 p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-[11px] text-amber-900 leading-snug">
                  <strong>⚠️ Mengalami error &quot;Maaf, saat ini tidak dapat membuka file&quot; saat klik Apps Script?</strong>
                  <p className="mt-1">
                    Hal ini terjadi karena browser Anda login dengan <strong>lebih dari 1 akun Google</strong> secara bersamaan.
                  </p>
                  <p className="mt-1 font-semibold text-blue-900">
                    Solusi: Buka Google Sheets di <strong>Jendela Penyamaran (Incognito / InPrivate: Ctrl+Shift+N)</strong> dan login hanya dengan 1 akun Google, lalu klik menu Ekstensi &gt; Apps Script kembali.
                  </p>
                </div>
              </li>
              <li>
                Hapus semua kode bawaan di editor, lalu klik tombol di bawah untuk menyalin script:
                <div className="mt-2 mb-2">
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copiedCode ? 'Script Berhasil Disalin!' : 'Salin Seluruh Kode Apps Script Connector'}
                  </button>
                </div>
              </li>
              <li>
                Tempel kode tersebut di Apps Script editor, lalu klik ikon <strong>Save (Simpan)</strong>.
              </li>
              <li>
                Klik tombol biru <strong>Deploy (Terapkan) &gt; New deployment (Penerapan baru)</strong> di pojok kanan atas.
              </li>
              <li>
                Klik ikon gerigi <strong>Select type &gt; Web app</strong>.
              </li>
              <li>
                Atur konfigurasi:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5 text-slate-600">
                  <li>Description: <strong>BPMS Connector</strong></li>
                  <li>Execute as: <strong>Me (Saya)</strong></li>
                  <li>
                    Who has access: <strong className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">Anyone (Siapa saja)</strong> (PENTING!)
                  </li>
                </ul>
              </li>
              <li>
                Klik <strong>Deploy</strong> &gt; pilih akun Google Anda &gt; klik <em>Advanced</em> &gt; <em>Go to BPMS (unsafe)</em> &gt; <em>Allow</em>.
              </li>
              <li>
                Salin <strong>Web App URL</strong> yang berakhiran <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">/exec</code>.
              </li>
            </ol>

            {/* Input Web App URL Form */}
            <form onSubmit={handleSaveWebAppUrl} className="p-4 bg-white border border-slate-300 rounded-xl space-y-3 shadow-xs">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-blue-600" />
                Tempel URL Web App Google Apps Script Di Sini
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={webAppUrlInput}
                  onChange={(e) => setWebAppUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={savingWebApp}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {savingWebApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Simpan & Hubungkan
                </button>
              </div>

              {webAppResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    webAppResult.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {webAppResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{webAppResult.message}</span>
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 2: TEMPLATE EXCEL FILE */}
        {activeTab === 'template' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  File Spreadsheet BPMS_WO_DATABASE Siap Pakai (.xlsx)
                </h4>
                <p className="text-xs text-slate-600 max-w-xl">
                  File ini sudah berisi kedua tab worksheet <strong>WIP</strong> (19 kolom) dan <strong>UNIT_CLOSE</strong> (22 kolom) lengkap dengan data contoh. Cukup unduh lalu upload ke Google Drive!
                </p>
              </div>
              <a
                href="/BPMS_WO_DATABASE_TEMPLATE.xlsx"
                download="BPMS_WO_DATABASE.xlsx"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Table className="w-4 h-4" />
                Download File Excel (.xlsx)
              </a>
            </div>

            {/* Headers preview */}
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">
                    Header Kolom Worksheet <code className="text-blue-700">WIP</code> (19 Kolom)
                  </span>
                  <button
                    onClick={() => copyToClipboard(WIP_HEADERS.join('\t'), true)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedWip ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedWip ? 'Tersalin' : 'Salin Header'}
                  </button>
                </div>
                <div className="p-2 bg-slate-50 rounded text-[11px] font-mono text-slate-600 break-all">
                  {WIP_HEADERS.join(', ')}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">
                    Header Kolom Worksheet <code className="text-emerald-700">UNIT_CLOSE</code> (22 Kolom)
                  </span>
                  <button
                    onClick={() => copyToClipboard(UNIT_CLOSE_HEADERS.join('\t'), false)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedClose ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedClose ? 'Tersalin' : 'Salin Header'}
                  </button>
                </div>
                <div className="p-2 bg-slate-50 rounded text-[11px] font-mono text-slate-600 break-all">
                  {UNIT_CLOSE_HEADERS.join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SERVICE ACCOUNT METHOD */}
        {activeTab === 'serviceaccount' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Catatan Service Account:</strong> Metode ini ditujukan bagi developer yang ingin menggunakan Google Cloud IAM di server Vercel. Kunci privat harus berformat RSA PEM lengkap. Jika Anda tidak ingin repot dengan GCP IAM, gunakan <strong>Metode 1 (Apps Script)</strong>.
              </div>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
              <li>
                Buka <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="w-3 h-3" /></a> &gt; Aktifkan <strong>Google Sheets API</strong>.
              </li>
              <li>
                Buat <strong>Service Account</strong> &gt; unduh file kunci <strong>JSON</strong>.
              </li>
              <li>
                Buka file JSON dan salin nilai <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">client_email</code> dan <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">private_key</code>.
              </li>
              <li>
                Bagikan spreadsheet Anda kepada email service account dengan izin <strong>Editor</strong>.
              </li>
              <li>
                Masukkan 3 environment variable di Vercel:
                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs mt-2 space-y-1">
                  <div>GOOGLE_SERVICE_ACCOUNT_EMAIL="..."</div>
                  <div>GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"</div>
                  <div>GOOGLE_SHEETS_SPREADSHEET_ID="..."</div>
                </div>
              </li>
            </ol>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
