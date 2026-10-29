/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { TargetUnit, TargetCategory, WorkOrder } from '../types';
import { formatDateIndo, formatDaysRemaining } from '../utils/dateHelper';
import { TargetStatusBadge, ProgressBadge, JobStoppedBadge } from '../components/StatusBadges';
import {
  CalendarClock,
  Search,
  RotateCcw,
  Eye,
  Edit,
  CheckCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  Car,
  MessageSquare,
} from 'lucide-react';

interface TargetSelesaiPageProps {
  targetList: TargetUnit[];
  loading: boolean;
  onRefresh: () => void;
  onViewDetail: (wo: WorkOrder) => void;
  onEditWo: (wo: WorkOrder) => void;
  onCloseWo: (wo: WorkOrder) => void;
  onFollowUpWa: (wo: WorkOrder) => void;
}

export const TargetSelesaiPage: React.FC<TargetSelesaiPageProps> = ({
  targetList,
  loading,
  onRefresh,
  onViewDetail,
  onEditWo,
  onCloseWo,
  onFollowUpWa,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Category counts
  const countMap: Record<string, number> = {
    ALL: targetList.length,
    OVERDUE: targetList.filter((t) => t.status_target === 'OVERDUE').length,
    TODAY: targetList.filter((t) => t.status_target === 'TODAY').length,
    'H-1': targetList.filter((t) => t.status_target === 'H-1').length,
    'H-2': targetList.filter((t) => t.status_target === 'H-2').length,
    'H-3': targetList.filter((t) => t.status_target === 'H-3').length,
    'ON TRACK': targetList.filter((t) => t.status_target === 'ON TRACK').length,
  };

  const filteredList = useMemo(() => {
    return targetList.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.status_target !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          item.no_wo.toLowerCase().includes(q) ||
          item.no_polisi.toLowerCase().includes(q) ||
          item.nama_customer.toLowerCase().includes(q) ||
          item.vendor.toLowerCase().includes(q) ||
          item.tipe_kendaraan.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [targetList, selectedCategory, searchTerm]);

  return (
    <div className="space-y-5">
      {/* Header and overview */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-600" />
            Monitoring Target Selesai (Asia/Jakarta)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Prioritas penanganan unit WIP berdasarkan selisih hari kalender terhadap target estimasi selesai
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
          title="Refresh Data"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Active ({countMap['ALL']})
          </button>

          <button
            onClick={() => setSelectedCategory('OVERDUE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'OVERDUE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            OVERDUE ({countMap['OVERDUE']})
          </button>

          <button
            onClick={() => setSelectedCategory('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'TODAY'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            TODAY ({countMap['TODAY']})
          </button>

          <button
            onClick={() => setSelectedCategory('H-1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'H-1'
                ? 'bg-yellow-500 text-white shadow-xs'
                : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border border-yellow-200'
            }`}
          >
            H-1 ({countMap['H-1']})
          </button>

          <button
            onClick={() => setSelectedCategory('H-2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'H-2'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
            }`}
          >
            H-2 ({countMap['H-2']})
          </button>

          <button
            onClick={() => setSelectedCategory('H-3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'H-3'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            H-3 ({countMap['H-3']})
          </button>

          <button
            onClick={() => setSelectedCategory('ON TRACK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              selectedCategory === 'ON TRACK'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            ON TRACK ({countMap['ON TRACK']})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari WO, Nopol..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Target Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-3 w-12 text-center">No</th>
                <th className="py-3.5 px-4">No. WO</th>
                <th className="py-3.5 px-4">No. Polisi</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Vendor</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4">Estimasi Selesai</th>
                <th className="py-3.5 px-4">Sisa Hari</th>
                <th className="py-3.5 px-4">Status Target</th>
                <th className="py-3.5 px-3 text-center">Job Stopped</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Car className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm">Tidak ada data unit pada kategori ini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => {
                  const isOverdue = item.status_target === 'OVERDUE';
                  const isToday = item.status_target === 'TODAY';

                  return (
                    <tr
                      key={item.no_wo}
                      className={`transition-colors ${
                        isOverdue
                          ? 'bg-rose-50/40 hover:bg-rose-50/70'
                          : isToday
                          ? 'bg-amber-50/30 hover:bg-amber-50/60'
                          : 'hover:bg-blue-50/30'
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center text-xs text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {item.no_wo}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs inline-block">
                          {item.no_polisi}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.tipe_kendaraan}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 text-xs font-medium">
                        {item.nama_customer}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {item.vendor}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <ProgressBadge progress={item.progress} />
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-slate-800 whitespace-nowrap">
                        {formatDateIndo(item.estimasi_selesai)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-black ${
                            item.selisih_hari < 0
                              ? 'text-rose-600'
                              : item.selisih_hari === 0
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {formatDaysRemaining(item.selisih_hari)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <TargetStatusBadge status={item.status_target} />
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <JobStoppedBadge stopped={item.job_stopped} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewDetail(item)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Detail WO"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onFollowUpWa(item)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Follow Up WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditWo(item)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit WO"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onCloseWo(item)}
                            className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                            title="Unit Close"
                          >
                            <CheckCheck className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
