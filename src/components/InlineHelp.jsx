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
      className="absolute left-0 right-0 top-full mt-2 p-3 bg-black shadow-xl border border-accenture-purple-dark flex items-start text-accenture-gray-light pointer-events-auto animate-in fade-in slide-in-from-top-1 z-50"
    >
      <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-accenture-purple-light" aria-hidden="true" />
      <div className="text-xs leading-relaxed">
        <strong className="block mb-1 text-white font-semibold">{info.title}</strong>
        {info.desc}
      </div>
    </div>
  );
}
