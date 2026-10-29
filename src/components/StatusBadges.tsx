/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TargetCategory } from '../types';
import { AlertCircle, CheckCircle2, Clock, PauseCircle } from 'lucide-react';

export const TargetStatusBadge: React.FC<{ status: TargetCategory; textOnly?: boolean }> = ({
  status,
  textOnly = false,
}) => {
  const config: Record<
    TargetCategory,
    { label: string; bg: string; text: string; border: string }
  > = {
    OVERDUE: {
      label: 'OVERDUE',
      bg: 'bg-rose-100 dark:bg-rose-950/60',
      text: 'text-rose-700 dark:text-rose-300 font-bold',
      border: 'border-rose-300 dark:border-rose-800',
    },
    TODAY: {
      label: 'TODAY',
      bg: 'bg-amber-100 dark:bg-amber-950/60',
      text: 'text-amber-800 dark:text-amber-300 font-bold',
      border: 'border-amber-300 dark:border-amber-700',
    },
    'H-1': {
      label: 'H-1 (Besok)',
      bg: 'bg-yellow-100 dark:bg-yellow-950/50',
      text: 'text-yellow-800 dark:text-yellow-300 font-semibold',
      border: 'border-yellow-300 dark:border-yellow-700',
    },
    'H-2': {
      label: 'H-2',
      bg: 'bg-sky-100 dark:bg-sky-950/50',
      text: 'text-sky-800 dark:text-sky-300 font-semibold',
      border: 'border-sky-300 dark:border-sky-700',
    },
    'H-3': {
      label: 'H-3',
      bg: 'bg-blue-100 dark:bg-blue-950/50',
      text: 'text-blue-800 dark:text-blue-300 font-semibold',
      border: 'border-blue-300 dark:border-blue-700',
    },
    'ON TRACK': {
      label: 'ON TRACK',
      bg: 'bg-emerald-100 dark:bg-emerald-950/50',
      text: 'text-emerald-800 dark:text-emerald-300 font-semibold',
      border: 'border-emerald-300 dark:border-emerald-700',
    },
  };

  const c = config[status] || config['ON TRACK'];

  if (textOnly) {
    return <span className={c.text}>{c.label}</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${c.bg} ${c.text} ${c.border}`}
    >
      {status === 'OVERDUE' && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
      {status === 'TODAY' && <Clock className="w-3.5 h-3.5 shrink-0" />}
      {c.label}
    </span>
  );
};

export const OtdBadge: React.FC<{ otd?: 'YA' | 'TIDAK' }> = ({ otd }) => {
  if (otd === 'YA') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5" />
        OTD: YA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
      <AlertCircle className="w-3.5 h-3.5" />
      OTD: TIDAK
    </span>
  );
};

export const JobStoppedBadge: React.FC<{ stopped?: 'YA' | 'TIDAK' }> = ({ stopped }) => {
  if (stopped === 'YA') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
        <PauseCircle className="w-3.5 h-3.5" />
        STOPPED (YA)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
      TIDAK
    </span>
  );
};

export const ProgressBadge: React.FC<{ progress: string }> = ({ progress }) => {
  const getBadgeClass = (prog: string) => {
    switch (prog) {
      case 'Bongkar':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'Ketok / Las':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Dempul':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'Epoxy':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Cat / Oven':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-semibold';
      case 'Poles':
        return 'bg-cyan-100 text-cyan-900 border-cyan-300';
      case 'Pasang / Assembling':
        return 'bg-teal-100 text-teal-900 border-teal-300';
      case 'Finishing & QC':
        return 'bg-blue-100 text-blue-900 border-blue-300 font-semibold';
      case 'Cuci & Siap Delivery':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeClass(
        progress
      )}`}
    >
      {progress || '-'}
    </span>
  );
};
