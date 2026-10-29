/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  Layers,
  CheckCheck,
  CalendarClock,
  Database,
  ExternalLink,
  X,
} from 'lucide-react';
import { BydLogo } from './BydLogo';

export type ActiveTab = 'dashboard' | 'input-wo' | 'wip' | 'unit-close' | 'target-selesai';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenSetup: () => void;
  isSheetsConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  onOpenSetup,
  isSheetsConnected,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Ringkasan & KPI Bengkel',
    },
    {
      id: 'input-wo' as ActiveTab,
      label: 'Input WO',
      icon: FilePlus2,
      description: 'Pendaftaran Work Order Baru',
    },
    {
      id: 'wip' as ActiveTab,
      label: 'Unit WIP',
      icon: Layers,
      description: 'Pengerjaan Berlangsung',
    },
    {
      id: 'unit-close' as ActiveTab,
      label: 'Unit Close',
      icon: CheckCheck,
      description: 'Histori Unit Selesai & OTD',
    },
    {
      id: 'target-selesai' as ActiveTab,
      label: 'Target Selesai',
      icon: CalendarClock,
      description: 'Monitoring Overdue & H-3',
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with 2024 BYD Wordmark Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <BydLogo size="sm" variant="white" className="h-5 drop-shadow-sm" />
              <span className="text-[10px] font-black tracking-wider text-red-500 uppercase px-1.5 py-0.5 bg-red-500/15 border border-red-500/30 rounded">
                Body & Paint
              </span>
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-[13px] tracking-tight text-white block truncate leading-tight">
                Progress Control System
              </span>
              <span className="text-[10px] text-slate-400 font-medium block truncate">
                Work Order & WIP Monitoring
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Menu Operasional
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <div className="flex-1 truncate">
                  <div className="text-sm leading-snug">{item.label}</div>
                  <div className={`text-[11px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Database Status & Setup Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/30">
          <div
            onClick={onOpenSetup}
            className="p-3 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" /> Database
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isSheetsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>
            <div className="text-xs font-semibold text-white">
              {isSheetsConnected ? 'Google Sheets Terhubung' : 'Mode Demo (Lokal)'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>{isSheetsConnected ? 'Tersinkronisasi' : 'Klik untuk Setup'}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
