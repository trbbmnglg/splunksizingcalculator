import React from 'react';

const COLOR_SCHEMES = {
  blue:    { gradient: 'from-cyan-500 to-blue-600',    border: 'border-blue-400',    shadow: 'hover:shadow-blue-500/20',    light: 'text-blue-100',    lighter: 'text-blue-200' },
  purple:  { gradient: 'from-purple-500 to-fuchsia-600', border: 'border-fuchsia-400', shadow: 'hover:shadow-fuchsia-500/20', light: 'text-fuchsia-100', lighter: 'text-fuchsia-200' },
  rose:    { gradient: 'from-orange-400 to-rose-500',  border: 'border-rose-400',    shadow: 'hover:shadow-rose-500/20',    light: 'text-rose-100',    lighter: 'text-rose-200' },
  emerald: { gradient: 'from-teal-400 to-emerald-600', border: 'border-emerald-400', shadow: 'hover:shadow-emerald-500/20', light: 'text-emerald-100', lighter: 'text-emerald-200' },
};

export default function MetricCard({ title, value, unit, subtitle, icon: Icon, colorScheme }) {
  const c = COLOR_SCHEMES[colorScheme];

  return (
    <div
      className={`bg-gradient-to-br ${c.gradient} p-6 shadow-sm text-white border ${c.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${c.shadow}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-medium ${c.light}`}>{title}</h3>
        <Icon className={`w-5 h-5 ${c.lighter}`} aria-hidden="true" />
      </div>
      <div className="text-4xl font-bold tracking-tight mb-1">
        {value} <span className={`text-xl ${c.lighter} font-medium`}>{unit}</span>
      </div>
      <div className={`text-sm ${c.light}`}>{subtitle}</div>
    </div>
  );
}
