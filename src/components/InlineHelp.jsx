import React from 'react';
import { Info } from 'lucide-react';
import { FIELD_DESCRIPTIONS } from '../utils/constants';

export default function InlineHelp({ field, isActive }) {
  if (!isActive) return null;
  const info = FIELD_DESCRIPTIONS[field];
  if (!info) return null;

  return (
    <div
      role="tooltip"
      id={`help-${field}`}
      className="absolute left-0 right-0 top-full mt-2 p-3 bg-slate-800 rounded-lg shadow-xl border border-slate-700 flex items-start text-slate-200 pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-top-1 z-50"
    >
      <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-400" aria-hidden="true" />
      <div className="text-xs leading-relaxed">
        <strong className="block mb-1 text-white font-semibold">{info.title}</strong>
        {info.desc}
      </div>
    </div>
  );
}
