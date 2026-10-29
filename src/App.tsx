/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { WorkOrder, ClosedWorkOrder, DashboardSummary, TargetUnit } from './types';
import { api } from './api/client';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { InputWoPage } from './pages/InputWoPage';
import { WipPage } from './pages/WipPage';
import { UnitClosePage } from './pages/UnitClosePage';
import { TargetSelesaiPage } from './pages/TargetSelesaiPage';
import { DetailModal } from './components/DetailModal';
import { EditWoModal } from './components/EditWoModal';
import { CloseWoModal } from './components/CloseWoModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { GoogleSheetsSetupModal } from './components/GoogleSheetsSetupModal';
import { Database, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [wipList, setWipList] = useState<WorkOrder[]>([]);
  const [closedList, setClosedList] = useState<ClosedWorkOrder[]>([]);
  const [targetList, setTargetList] = useState<TargetUnit[]>([]);
  const [isSheetsConnected, setIsSheetsConnected] = useState<boolean>(false);

  // Loading & error states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals state
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedWoDetail, setSelectedWoDetail] = useState<WorkOrder | ClosedWorkOrder | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedWoEdit, setSelectedWoEdit] = useState<WorkOrder | null>(null);

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedWoClose, setSelectedWoClose] = useState<WorkOrder | null>(null);

  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [selectedWoWa, setSelectedWoWa] = useState<WorkOrder | ClosedWorkOrder | null>(null);

  // Global fetch handler
  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    setLoadError(null);

    try {
      // 1. Health check
      try {
        const health = await api.getHealth();
        setIsSheetsConnected(Boolean(health.connected_to_sheets));
      } catch {
        setIsSheetsConnected(false);
      }

      // 2. Load lists in parallel
      const [dash, wip, closed, targets] = await Promise.all([
        api.getDashboard().catch((err) => {
          console.warn('Dashboard fetch error:', err);
          return null;
        }),
        api.getWipList().catch(() => []),
        api.getClosedList().catch(() => []),
        api.getTargetUnits().catch(() => []),
      ]);

      if (dash) setDashboardData(dash);
      setWipList(wip);
      setClosedList(closed);
      setTargetList(targets);
    } catch (err: any) {
      console.error('Data loading error:', err);
      setLoadError(err?.message || 'Gagal memuat data dari server.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Modal openers
  const handleOpenDetail = (wo: WorkOrder | ClosedWorkOrder) => {
    setSelectedWoDetail(wo);
    setDetailModalOpen(true);
  };

  const handleOpenEdit = (wo: WorkOrder) => {
    setSelectedWoEdit(wo);
    setEditModalOpen(true);
  };

  const handleOpenClose = (wo: WorkOrder) => {
    setSelectedWoClose(wo);
    setCloseModalOpen(true);
  };

  const handleOpenWa = (wo: WorkOrder | ClosedWorkOrder) => {
    setSelectedWoWa(wo);
    setWhatsAppModalOpen(true);
  };

  // Handlers after mutation
  const handleWoCreated = (_newWo: WorkOrder) => {
    loadAllData();
  };

  const handleWoUpdated = (_updated: WorkOrder) => {
    loadAllData();
  };

  const handleWoClosed = (_closed: ClosedWorkOrder) => {
    loadAllData();
  };

  // Page title mapping
  const pageMeta: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Operasional',
      subtitle: 'Ringkasan KPI Work Order, WIP Aktif, Unit Close & Capaian OTD',
    },
    'input-wo': {
      title: 'Input Work Order Baru',
      subtitle: 'Form registrasi estimasi, item jasa, part, dan status kendaraan',
    },
    wip: {
      title: 'Daftar Unit WIP (Work In Progress)',
      subtitle: 'Pengawasan pengerjaan fisik bengkel, vendor, dan progres panel',
    },
    'unit-close': {
      title: 'Histori Unit Close',
      subtitle: 'Arsip penyerahan kendaraan selesai dan evaluasi On-Time Delivery',
    },
    'target-selesai': {
      title: 'Target Selesai & Batas Waktu',
      subtitle: 'Pengelompokan prioritas unit: Overdue, Hari Ini, dan H-3 s/d H-1',
    },
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileMenuOpen}
        setIsOpenMobile={setIsMobileMenuOpen}
        onOpenSetup={() => setSetupModalOpen(true)}
        isSheetsConnected={isSheetsConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          title={pageMeta[activeTab].title}
          subtitle={pageMeta[activeTab].subtitle}
          onRefresh={loadAllData}
          isRefreshing={isRefreshing}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenSetup={() => setSetupModalOpen(true)}
          isSheetsConnected={isSheetsConnected}
        />

        {/* Database Warning Banner (if running in Local Demo Mode) */}
        {!isSheetsConnected && (
          <div className="mx-4 sm:mx-8 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Mode Demonstrasi:</strong> Kredensial Google Sheets belum terpasang. Aplikasi berjalan lancar menggunakan database lokal sementara.
              </span>
            </div>
            <button
              onClick={() => setSetupModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Database className="w-3.5 h-3.5" />
              Setup Google Sheets
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-8">
          {activeTab === 'dashboard' && (
            <DashboardPage
              data={dashboardData}
              loading={isRefreshing}
              error={loadError}
              onRefresh={loadAllData}
              onViewDetail={handleOpenDetail}
              onCloseWo={handleOpenClose}
              onFollowUpWa={handleOpenWa}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'input-wo' && (
            <InputWoPage
              onSuccessCreated={handleWoCreated}
              onNavigateToWip={() => setActiveTab('wip')}
            />
          )}

          {activeTab === 'wip' && (
            <WipPage
              wipList={wipList}
              loading={isRefreshing}
              onRefresh={loadAllData}
              onViewDetail={handleOpenDetail}
              onEditWo={handleOpenEdit}
              onCloseWo={handleOpenClose}
              onFollowUpWa={handleOpenWa}
              onNavigateToInput={() => setActiveTab('input-wo')}
            />
          )}

          {activeTab === 'unit-close' && (
            <UnitClosePage
              closedList={closedList}
              loading={isRefreshing}
              onRefresh={loadAllData}
              onViewDetail={handleOpenDetail}
              onFollowUpWa={handleOpenWa}
            />
          )}

          {activeTab === 'target-selesai' && (
            <TargetSelesaiPage
              targetList={targetList}
              loading={isRefreshing}
              onRefresh={loadAllData}
              onViewDetail={handleOpenDetail}
              onEditWo={handleOpenEdit}
              onCloseWo={handleOpenClose}
              onFollowUpWa={handleOpenWa}
            />
          )}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <DetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        data={selectedWoDetail}
        onFollowUpWa={handleOpenWa}
      />

      <EditWoModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        workOrder={selectedWoEdit}
        onSuccess={handleWoUpdated}
      />

      <CloseWoModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        workOrder={selectedWoClose}
        onSuccess={handleWoClosed}
      />

      <WhatsAppModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        workOrder={selectedWoWa}
      />

      <GoogleSheetsSetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        onStatusRefresh={loadAllData}
      />
    </div>
  );
}
