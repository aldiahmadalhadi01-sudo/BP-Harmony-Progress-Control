/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DashboardSummary, WorkOrder, ClosedWorkOrder } from '../types';
import { formatDateIndo, calculateDaysDiff, formatDaysRemaining } from '../utils/dateHelper';
import { TargetStatusBadge, ProgressBadge, JobStoppedBadge } from '../components/StatusBadges';
import {
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp,
  RotateCcw,
  Eye,
  CheckCheck,
  PauseCircle,
  Car,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardPageProps {
  data: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onViewDetail: (wo: WorkOrder) => void;
  onCloseWo: (wo: WorkOrder) => void;
  onFollowUpWa: (wo: WorkOrder) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  loading,
  error,
  onRefresh,
  onViewDetail,
  onCloseWo,
  onFollowUpWa,
  onNavigateTab,
}) => {
  const [activeTableTab, setActiveTableTab] = useState<'today' | 'overdue' | 'stopped'>('today');

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Memuat data operasional dashboard...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-3 max-w-xl mx-auto my-12">
        <div className="flex items-center gap-2 font-bold text-base">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>Gagal Mengambil Data Dashboard</span>
        </div>
        <p className="text-sm">{error}</p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Coba Lagi
        </button>
      </div>
    );
  }

  const d = data || {
    total_wip: 0,
    total_close_month: 0,
    target_today: 0,
    near_target: 0,
    overdue: 0,
    otd_count_ya: 0,
    otd_count_tidak: 0,
    otd_percentage: 0,
    monthly_in: [],
    monthly_close: [],
    progress_dist: [],
    today_units: [],
    overdue_units: [],
    job_stopped_units: [],
    connection_status: { connected_to_sheets: false, mode: 'LOCAL_DEMO' as const },
  };

  // Chart data: Monthly WO In & Monthly Close
  const barChartData = {
    labels: d.monthly_in.map((m) => m.label),
    datasets: [
      {
        label: 'WO Masuk (In)',
        data: d.monthly_in.map((m) => m.count),
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        borderRadius: 6,
      },
      {
        label: 'Unit Close',
        data: d.monthly_close.map((m) => m.count),
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 6,
      },
    ],
  };

  // Chart data: OTD Doughnut
  const otdChartData = {
    labels: ['OTD: YA (Tepat Waktu)', 'OTD: TIDAK (Terlambat)'],
    datasets: [
      {
        data: [d.otd_count_ya, d.otd_count_tidak],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Chart data: Progress Distribution Doughnut
  const progressLabels = d.progress_dist.map((p) => p.progress);
  const progressCounts = d.progress_dist.map((p) => p.count);
  const progressChartData = {
    labels: progressLabels,
    datasets: [
      {
        data: progressCounts,
        backgroundColor: [
          '#64748b',
          '#d97706',
          '#ea580c',
          '#9333ea',
          '#4f46e5',
          '#06b6d4',
          '#0d9488',
          '#2563eb',
          '#10b981',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* 6 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Total WIP */}
        <div
          onClick={() => onNavigateTab('wip')}
          className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unit WIP Aktif</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{d.total_wip}</div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-0.5">
            Lihat daftar WIP <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* 2. Unit Close Bulan Ini */}
        <div
          onClick={() => onNavigateTab('unit-close')}
          className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Close Bulan Ini</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{d.total_close_month}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
            Histori Close <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* 3. Target Selesai Hari Ini */}
        <div
          onClick={() => {
            onNavigateTab('target-selesai');
          }}
          className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target Hari Ini</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{d.target_today}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">Jatuh tempo hari ini</div>
        </div>

        {/* 4. H-3 s/d H-1 */}
        <div
          onClick={() => onNavigateTab('target-selesai')}
          className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-sky-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">H-3 s/d H-1</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-700 mt-2">{d.near_target}</div>
          <div className="text-[11px] text-sky-600 font-semibold mt-1">Mendekati target</div>
        </div>

        {/* 5. Unit Terlambat (Overdue) */}
        <div
          onClick={() => onNavigateTab('target-selesai')}
          className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Overdue</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{d.overdue}</div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">Lewat batas target</div>
        </div>

        {/* 6. On-Time Delivery % */}
        <div
          onClick={() => onNavigateTab('unit-close')}
          className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">OTD Delivery</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-2">{d.otd_percentage}%</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            YA: {d.otd_count_ya} • TIDAK: {d.otd_count_tidak}
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Trend WO Masuk & Unit Close (2 cols) */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Volume WO Masuk vs Unit Close per Bulan
              </h3>
              <p className="text-xs text-slate-500">Perbandingan produktivitas bengkel selama 6 bulan terakhir</p>
            </div>
          </div>
          <div className="h-64 sm:h-72">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } },
                },
              }}
            />
          </div>
        </div>

        {/* Chart 2: OTD Comparison & Progress Distribution in Tabs / Stack */}
        <div className="space-y-6">
          {/* OTD Doughnut */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Perbandingan OTD (On-Time Delivery)
            </h3>
            <div className="h-44 flex items-center justify-center">
              {d.otd_count_ya + d.otd_count_tidak > 0 ? (
                <Doughnut
                  data={otdChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                    },
                    cutout: '65%',
                  }}
                />
              ) : (
                <div className="text-xs text-slate-400 italic">Belum ada unit close yang tercatat</div>
              )}
            </div>
          </div>

          {/* Progress Distribution */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Distribusi Unit Berdasarkan Progress
            </h3>
            <div className="h-44 flex items-center justify-center">
              {d.progress_dist.length > 0 ? (
                <Doughnut
                  data={progressChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } },
                    },
                    cutout: '55%',
                  }}
                />
              ) : (
                <div className="text-xs text-slate-400 italic">Belum ada unit aktif di WIP</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tables Section with Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Pemantauan Prioritas Unit</h3>
            <p className="text-xs text-slate-500">Akses cepat unit target hari ini, overdue, dan job stopped</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTableTab('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTableTab === 'today'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Target Hari Ini ({d.today_units.length})
            </button>
            <button
              onClick={() => setActiveTableTab('overdue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTableTab === 'overdue'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Terlambat / Overdue ({d.overdue_units.length})
            </button>
            <button
              onClick={() => setActiveTableTab('stopped')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTableTab === 'stopped'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PauseCircle className="w-3.5 h-3.5 text-red-600" />
              Job Stopped ({d.job_stopped_units.length})
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {(() => {
            const currentList =
              activeTableTab === 'today'
                ? d.today_units
                : activeTableTab === 'overdue'
                ? d.overdue_units
                : d.job_stopped_units;

            if (currentList.length === 0) {
              return (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <p className="text-sm font-semibold">Tidak ada unit pada kategori ini.</p>
                  <p className="text-xs">Semua pengerjaan berjalan sesuai target.</p>
                </div>
              );
            }

            return (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">No. WO</th>
                    <th className="py-3 px-4">No. Polisi / Kendaraan</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Target Selesai</th>
                    <th className="py-3 px-4">Status / Sisa</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {currentList.map((wo) => {
                    const diff = calculateDaysDiff(wo.estimasi_selesai);
                    return (
                      <tr key={wo.no_wo} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">{wo.no_wo}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{wo.no_polisi}</div>
                          <div className="text-xs text-slate-500">{wo.tipe_kendaraan}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{wo.nama_customer}</td>
                        <td className="py-3 px-4 text-xs text-slate-600">{wo.vendor}</td>
                        <td className="py-3 px-4">
                          <ProgressBadge progress={wo.progress} />
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {formatDateIndo(wo.estimasi_selesai)}
                        </td>
                        <td className="py-3 px-4">
                          {activeTableTab === 'stopped' ? (
                            <JobStoppedBadge stopped="YA" />
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-slate-700">
                                {formatDaysRemaining(diff)}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewDetail(wo)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Detail WO"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onFollowUpWa(wo)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Follow Up WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onCloseWo(wo)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Unit Close"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
