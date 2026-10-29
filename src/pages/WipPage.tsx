/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { WorkOrder, DEFAULT_PROGRESS_OPTIONS, DEFAULT_VENDORS } from '../types';
import { formatDateIndo, calculateDaysDiff, formatDaysRemaining, getTargetCategory } from '../utils/dateHelper';
import { ProgressBadge, JobStoppedBadge, TargetStatusBadge } from '../components/StatusBadges';
import {
  Layers,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Car,
  MessageSquare,
} from 'lucide-react';

interface WipPageProps {
  wipList: WorkOrder[];
  loading: boolean;
  onRefresh: () => void;
  onViewDetail: (wo: WorkOrder) => void;
  onEditWo: (wo: WorkOrder) => void;
  onCloseWo: (wo: WorkOrder) => void;
  onFollowUpWa: (wo: WorkOrder) => void;
  onNavigateToInput: () => void;
}

export const WipPage: React.FC<WipPageProps> = ({
  wipList,
  loading,
  onRefresh,
  onViewDetail,
  onEditWo,
  onCloseWo,
  onFollowUpWa,
  onNavigateToInput,
}) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [progressFilter, setProgressFilter] = useState('ALL');
  const [jobStoppedFilter, setJobStoppedFilter] = useState('ALL');
  const [estimasiDateFilter, setEstimasiDateFilter] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState<keyof WorkOrder>('estimasi_selesai');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Filter & sort logic
  const filteredList = useMemo(() => {
    return wipList
      .filter((item) => {
        // Global search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const match =
            item.no_wo.toLowerCase().includes(q) ||
            item.no_polisi.toLowerCase().includes(q) ||
            item.nama_customer.toLowerCase().includes(q) ||
            item.tipe_kendaraan.toLowerCase().includes(q) ||
            item.asuransi.toLowerCase().includes(q) ||
            item.vendor.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Vendor filter
        if (vendorFilter !== 'ALL' && item.vendor !== vendorFilter) return false;

        // Progress filter
        if (progressFilter !== 'ALL' && item.progress !== progressFilter) return false;

        // Job Stopped filter
        if (jobStoppedFilter !== 'ALL' && item.job_stopped !== jobStoppedFilter) return false;

        // Estimasi Selesai filter
        if (estimasiDateFilter && item.estimasi_selesai !== estimasiDateFilter) return false;

        return true;
      })
      .sort((a, b) => {
        const valA = (a[sortField] || '').toString().toLowerCase();
        const valB = (b[sortField] || '').toString().toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [wipList, searchTerm, vendorFilter, progressFilter, jobStoppedFilter, estimasiDateFilter, sortField, sortAsc]);

  // Pagination slice
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage]);

  const toggleSort = (field: keyof WorkOrder) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setVendorFilter('ALL');
    setProgressFilter('ALL');
    setJobStoppedFilter('ALL');
    setEstimasiDateFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header and Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Daftar Unit Work In Progress (WIP)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {wipList.length} unit aktif sedang dalam proses perbaikan body & cat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
            title="Refresh Data"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNavigateToInput}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            + Input WO Baru
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Global Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari No. WO, Nopol, Customer..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Progress Filter */}
          <div>
            <select
              value={progressFilter}
              onChange={(e) => {
                setProgressFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
            >
              <option value="ALL">Semua Progress</option>
              {DEFAULT_PROGRESS_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Filter */}
          <div>
            <select
              value={vendorFilter}
              onChange={(e) => {
                setVendorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
            >
              <option value="ALL">Semua Vendor</option>
              {DEFAULT_VENDORS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Job Stopped Filter */}
          <div>
            <select
              value={jobStoppedFilter}
              onChange={(e) => {
                setJobStoppedFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
            >
              <option value="ALL">Semua Status Job</option>
              <option value="TIDAK">Normal (TIDAK Stopped)</option>
              <option value="YA">Pekerjaan Terhenti (YA)</option>
            </select>
          </div>
        </div>

        {/* Second Row: Date Filter and Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Filter Target Selesai:</span>
            <input
              type="date"
              value={estimasiDateFilter}
              onChange={(e) => {
                setEstimasiDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {estimasiDateFilter && (
              <button
                onClick={() => setEstimasiDateFilter('')}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              Menampilkan <strong>{filteredList.length}</strong> dari <strong>{wipList.length}</strong> unit
            </span>
            {(searchTerm || vendorFilter !== 'ALL' || progressFilter !== 'ALL' || jobStoppedFilter !== 'ALL' || estimasiDateFilter) && (
              <button
                onClick={handleResetFilters}
                className="text-blue-600 hover:underline font-bold text-xs"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
                <th className="py-3.5 px-3 w-12 text-center">No</th>
                <th
                  onClick={() => toggleSort('no_wo')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>No. WO</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('tanggal_in')}
                  className="py-3.5 px-3 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal In</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">No. Polisi</th>
                <th className="py-3.5 px-4">Tipe Kendaraan</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Vendor</th>
                <th className="py-3.5 px-4">Progress</th>
                <th
                  onClick={() => toggleSort('estimasi_selesai')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Estimasi Selesai</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-3 text-center">Job Stopped</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Car className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm">Tidak ada data unit WIP yang cocok.</p>
                      <p className="text-xs">Coba sesuaikan kata kunci pencarian atau filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, index) => {
                  const daysDiff = calculateDaysDiff(item.estimasi_selesai);
                  const targetCat = getTargetCategory(daysDiff);

                  return (
                    <tr key={item.no_wo} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-3 text-center text-xs text-slate-400 font-mono">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {item.no_wo}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                        {formatDateIndo(item.tanggal_in)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          {item.no_polisi}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 text-xs font-medium">
                        {item.tipe_kendaraan}
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
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-800">
                            {formatDateIndo(item.estimasi_selesai)}
                          </span>
                          <TargetStatusBadge status={targetCat} />
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <JobStoppedBadge stopped={item.job_stopped} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewDetail(item)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Detail Lengkap"
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
                            title="Edit Data"
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

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
          <div>
            Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, currentPage - 3), currentPage + 2)
              .map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
