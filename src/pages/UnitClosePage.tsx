/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ClosedWorkOrder, DEFAULT_VENDORS } from '../types';
import { formatDateIndo } from '../utils/dateHelper';
import { OtdBadge } from '../components/StatusBadges';
import { api } from '../api/client';
import {
  CheckCheck,
  Search,
  Download,
  Eye,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Car,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';

interface UnitClosePageProps {
  closedList: ClosedWorkOrder[];
  loading: boolean;
  onRefresh: () => void;
  onViewDetail: (wo: ClosedWorkOrder) => void;
  onFollowUpWa: (wo: ClosedWorkOrder) => void;
}

export const UnitClosePage: React.FC<UnitClosePageProps> = ({
  closedList,
  loading,
  onRefresh,
  onViewDetail,
  onFollowUpWa,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [otdFilter, setOtdFilter] = useState('ALL');
  const [actualDateFilter, setActualDateFilter] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<keyof ClosedWorkOrder>('closed_at');
  const [sortAsc, setSortAsc] = useState<boolean>(false); // newest closed first

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Filter & sort
  const filteredList = useMemo(() => {
    return closedList
      .filter((item) => {
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const match =
            item.no_wo.toLowerCase().includes(q) ||
            item.no_polisi.toLowerCase().includes(q) ||
            item.nama_customer.toLowerCase().includes(q) ||
            item.tipe_kendaraan.toLowerCase().includes(q);
          if (!match) return false;
        }

        if (vendorFilter !== 'ALL' && item.vendor !== vendorFilter) return false;
        if (otdFilter !== 'ALL' && item.ontime_delivery !== otdFilter) return false;
        if (actualDateFilter && item.aktual_unit_selesai !== actualDateFilter) return false;

        return true;
      })
      .sort((a, b) => {
        const valA = (a[sortField] || '').toString().toLowerCase();
        const valB = (b[sortField] || '').toString().toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [closedList, searchTerm, vendorFilter, otdFilter, actualDateFilter, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage]);

  const toggleSort = (field: keyof ClosedWorkOrder) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCsv = () => {
    const link = document.createElement('a');
    link.href = api.getExportCsvUrl();
    link.setAttribute('download', `BPMS_UNIT_CLOSE_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const otdYaCount = closedList.filter((c) => c.ontime_delivery === 'YA').length;
  const otdTidakCount = closedList.filter((c) => c.ontime_delivery === 'TIDAK').length;
  const totalCount = otdYaCount + otdTidakCount;
  const otdPct = totalCount > 0 ? Math.round((otdYaCount / totalCount) * 100 * 10) / 10 : 0;

  return (
    <div className="space-y-5">
      {/* Header card with summary & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CheckCheck className="w-5 h-5 text-emerald-600" />
            Histori Unit Close & On-Time Delivery (OTD)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {closedList.length} unit telah diserahterimakan ke konsumen (OTD Akumulatif: {otdPct}%)
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
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Global Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari WO, Nopol, Customer..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* OTD Filter */}
          <div>
            <select
              value={otdFilter}
              onChange={(e) => {
                setOtdFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
            >
              <option value="ALL">Semua Status OTD</option>
              <option value="YA">OTD: YA (Tepat Waktu)</option>
              <option value="TIDAK">OTD: TIDAK (Terlambat)</option>
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

          {/* Aktual Selesai Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={actualDateFilter}
              onChange={(e) => {
                setActualDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              title="Filter Tanggal Aktual Selesai"
            />
            {actualDateFilter && (
              <button
                onClick={() => setActualDateFilter('')}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
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
                <th className="py-3.5 px-4">Nama Customer</th>
                <th className="py-3.5 px-4">Vendor</th>
                <th className="py-3.5 px-4">Estimasi Selesai</th>
                <th
                  onClick={() => toggleSort('aktual_unit_selesai')}
                  className="py-3.5 px-4 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Aktual Selesai</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">OTD</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Car className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm">Belum ada data Unit Close yang cocok.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, index) => (
                  <tr key={item.no_wo} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3 text-center text-xs text-slate-400 font-mono">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {item.no_wo}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                      {formatDateIndo(item.tanggal_in)}
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
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {formatDateIndo(item.estimasi_selesai)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-emerald-700 whitespace-nowrap">
                      {formatDateIndo(item.aktual_unit_selesai)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <OtdBadge otd={item.ontime_delivery} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewDetail(item)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                          title="Lihat Detail Histori"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Detail</span>
                        </button>
                        <button
                          onClick={() => onFollowUpWa(item)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                          title="Kirim Pesan WhatsApp Selesai"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="hidden sm:inline">WA</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
