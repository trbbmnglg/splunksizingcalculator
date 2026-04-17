import { PieChart, AlertTriangle } from 'lucide-react';

export default function UtilizationCard({ metrics, monthlyLicenseQuotaGb }) {
  // Utilization thresholds tied to brand palette (no green/amber — use
  // purple spectrum + pink so the color signal stays Accenture-compliant).
  const utilBarColor = metrics.monthlyUtilizationPercent > 100
    ? 'bg-accenture-pink'
    : metrics.monthlyUtilizationPercent > 80
      ? 'bg-accenture-purple-light'
      : 'bg-accenture-purple';

  const cappedPct = Math.min(metrics.monthlyUtilizationPercent, 100);

  return (
    <div className="bg-black p-7 text-white border border-black transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-accenture-purple" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-accenture-gray-light">Monthly license utilization</h3>
        <PieChart className="w-5 h-5 text-accenture-purple-light" aria-hidden="true" />
      </div>
      <div className="flex items-end justify-between mb-4">
        <div className="text-4xl font-semibold tracking-tight">
          {metrics.monthlyUtilizationPercent.toFixed(2)} <span className="text-xl text-accenture-gray-light font-medium">%</span>
        </div>
        <div className="text-sm text-accenture-gray-light mb-1">of {monthlyLicenseQuotaGb} GB/month limit</div>
      </div>
      <div className="h-3 w-full bg-accenture-purple-darkest/40 overflow-hidden" role="progressbar" aria-valuenow={Math.round(cappedPct)} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`h-full transition-all duration-500 ${utilBarColor}`}
          style={{ width: `${cappedPct}%` }}
        />
      </div>
      {metrics.monthlyUtilizationPercent > 100 && (
        <p className="text-xs text-accenture-pink mt-3 flex items-center gap-1.5 font-medium bg-accenture-purple-darkest/40 p-2.5" role="alert">
          <AlertTriangle className="w-4 h-4" aria-hidden="true" /> This data source exceeds your entire monthly license quota.
        </p>
      )}
    </div>
  );
}
