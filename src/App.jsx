import React, { useState } from 'react';
import { Calculator, Database, Server, Settings, Activity, Clock, HardDrive, AlertTriangle, PieChart, ExternalLink } from 'lucide-react';

export default function App() {
  // Input State
  const [jobs, setJobs] = useState(1000);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [payloadSizeKb, setPayloadSizeKb] = useState(183);
  const [ingestionMethod, setIngestionMethod] = useState('api');

  // Advanced Settings State
  const [rawStoragePercent, setRawStoragePercent] = useState(15);
  const [metaStoragePercent, setMetaStoragePercent] = useState(35);
  const [overheadPercent, setOverheadPercent] = useState(25.0);
  const [retentionDays, setRetentionDays] = useState(30);
  const [monthlyLicenseQuotaGb, setMonthlyLicenseQuotaGb] = useState(300); // Changed to Monthly Quota

  // Handlers
  const handleJobsChange = (e) => {
    const newJobs = Number(e.target.value);
    if (jobs > 0 && newJobs > 0) {
      const ratio = newJobs / jobs;
      setPayloadSizeKb(+(payloadSizeKb * ratio).toFixed(2));
    } else if (jobs === 0 && newJobs > 0) {
      setPayloadSizeKb((newJobs / 1000) * 183);
    }
    setJobs(newJobs);
  };

  const handleMethodChange = (method) => {
    setIngestionMethod(method);
    if (method === 'uf') {
      setOverheadPercent(12.11);
    } else {
      setOverheadPercent(25.0);
    }
  };

  // Constants
  const MINUTES_PER_DAY = 1440;

  // FIX #3: Guard against division by zero, show warning
  const safeInterval = Math.max(intervalMinutes || 1, 0.1);
  const intervalWarning = !intervalMinutes || intervalMinutes <= 0;

  // Calculations
  const intervalsPerDay = MINUTES_PER_DAY / safeInterval;
  const eventsPerDay = jobs * intervalsPerDay;

  // Base raw data (pre-overhead)
  const dailyRawKbBase = payloadSizeKb * intervalsPerDay;
  const dailyRawMbBase = dailyRawKbBase / 1024;

  // License Volume (raw + overhead — what Splunk counts toward license)
  const licenseVolumeMb = dailyRawMbBase * (1 + overheadPercent / 100);
  const licenseVolumeGb = licenseVolumeMb / 1024;

  // FIX #1: Storage ratios applied to dailyRawMbBase, NOT licenseVolumeMb
  // Raw compression: how much disk the compressed rawdata bucket uses
  // Metadata: tsidx / bloom filters / metadata overhead on top of raw
  const storageRawMb = dailyRawMbBase * (rawStoragePercent / 100);
  const storageMetaMb = dailyRawMbBase * (metaStoragePercent / 100);
  const dailyStorageTotalMb = storageRawMb + storageMetaMb;
  const dailyStorageTotalGb = dailyStorageTotalMb / 1024;

  // Monthly Projections
  const monthlyLicenseVolumeGb = licenseVolumeGb * 30;
  const monthlyStorageTotalGb = dailyStorageTotalGb * 30;

  // Monthly License Utilization
  const monthlyUtilizationPercent = monthlyLicenseQuotaGb > 0 ? (monthlyLicenseVolumeGb / monthlyLicenseQuotaGb) * 100 : 0;

  // Retention Total
  const totalRetentionGb = dailyStorageTotalGb * retentionDays;

  const inputClass =
    'w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');`}</style>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center space-x-3 pb-6 border-b border-slate-200">
          <div className="p-3 bg-blue-600 rounded-lg shadow-sm">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Splunk Sizing Calculator</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Inputs Section */}
          <div className="lg:col-span-5 space-y-6">

            {/* Primary Inputs */}
            <div className="bg-white p-6 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-slate-800">
                <Activity className="w-5 h-5 mr-2 text-blue-500" />
                Data Source Parameters
              </h2>
              <div className="space-y-4">

                {/* Ingestion Method */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Ingestion Method</label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleMethodChange('api')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors border ${
                        ingestionMethod === 'api'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      API (HEC / JSON)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMethodChange('uf')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors border ${
                        ingestionMethod === 'uf'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Universal Forwarder
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {ingestionMethod === 'api'
                      ? 'API ingestion wraps events in JSON envelopes, typically adding ~25% metadata overhead to license volume.'
                      : 'UF strips JSON wrappers before indexing, adding only ~12.1% Splunk metadata overhead.'}
                  </p>
                </div>

                {/* Number of Jobs */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Number of Jobs</label>
                  <input
                    type="number"
                    value={jobs}
                    onChange={handleJobsChange}
                    min={1}
                    className={inputClass}
                  />
                </div>

                {/* Polling Interval — FIX #3: visual warning */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Polling Interval (Minutes)</label>
                  <input
                    type="number"
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                    min={1}
                    className={`${inputClass} ${intervalWarning ? 'border-amber-400 focus:ring-amber-400' : ''}`}
                  />
                  {intervalWarning && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Interval must be &gt; 0. Defaulting to 1 minute.
                    </p>
                  )}
                </div>

                {/* FIX #2: Clarified label — per-poll batch size, not per individual event */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Payload Size per Poll Batch (KB)
                  </label>
                  <input
                    type="number"
                    value={payloadSizeKb}
                    readOnly
                    className={`${inputClass} bg-slate-100 text-slate-500 cursor-not-allowed focus:ring-0 focus:border-slate-200`}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Total KB for all {jobs.toLocaleString()} job records in a single polling response. Scales automatically with job count changes.
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-white p-6 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-slate-800">
                <Settings className="w-5 h-5 mr-2 text-slate-500" />
                Splunk Index Settings
              </h2>
              <div className="space-y-4">

                {/* Current License Quota */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Monthly License Quota (GB/month)</label>
                  <input
                    type="number"
                    value={monthlyLicenseQuotaGb}
                    onChange={(e) => setMonthlyLicenseQuotaGb(Number(e.target.value))}
                    min={1}
                    step="1"
                    className={inputClass}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Your total provisioned Splunk ingest capacity per month.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Raw Comp. Ratio (%)</label>
                    <input
                      type="number"
                      value={rawStoragePercent}
                      onChange={(e) => setRawStoragePercent(Number(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Metadata Ratio (%)</label>
                    <input
                      type="number"
                      value={metaStoragePercent}
                      onChange={(e) => setMetaStoragePercent(Number(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 -mt-2">
                  Both ratios are applied to the <span className="font-semibold">pre-overhead raw volume</span> ({dailyRawMbBase.toFixed(1)} MB/day), not the license total.
                </p>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">License Overhead / Buffer (%)</label>
                  <input
                    type="number"
                    value={overheadPercent}
                    step="0.01"
                    onChange={(e) => setOverheadPercent(Number(e.target.value))}
                    className={inputClass}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Applied only to license volume calculation. Storage ratios use raw data volume directly.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Retention Period (Days)</label>
                  <input
                    type="number"
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7 space-y-6">

            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 shadow-sm text-white border border-blue-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-blue-100">Daily License Volume</h3>
                  <Server className="w-5 h-5 text-blue-200" />
                </div>
                <div className="text-4xl font-bold tracking-tight mb-1">
                  {licenseVolumeMb.toFixed(1)} <span className="text-xl text-blue-200 font-medium">MB</span>
                </div>
                <div className="text-sm text-blue-100">{licenseVolumeGb.toFixed(4)} GB / day</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 p-6 shadow-sm text-white border border-fuchsia-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-fuchsia-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-fuchsia-100">Daily Storage Req.</h3>
                  <Database className="w-5 h-5 text-fuchsia-200" />
                </div>
                <div className="text-4xl font-bold tracking-tight mb-1">
                  {dailyStorageTotalMb.toFixed(1)} <span className="text-xl text-fuchsia-200 font-medium">MB</span>
                </div>
                <div className="text-sm text-fuchsia-100">{dailyStorageTotalGb.toFixed(4)} GB / day</div>
              </div>

              <div className="bg-gradient-to-br from-orange-400 to-rose-500 p-6 shadow-sm text-white border border-rose-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-rose-100">Monthly License</h3>
                  <Server className="w-5 h-5 text-rose-200" />
                </div>
                <div className="text-4xl font-bold tracking-tight mb-1">
                  {monthlyLicenseVolumeGb.toFixed(2)} <span className="text-xl text-rose-200 font-medium">GB</span>
                </div>
                <div className="text-sm text-rose-100">30-day projected volume</div>
              </div>

              <div className="bg-gradient-to-br from-teal-400 to-emerald-600 p-6 shadow-sm text-white border border-emerald-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-emerald-100">Monthly Storage</h3>
                  <Database className="w-5 h-5 text-emerald-200" />
                </div>
                <div className="text-4xl font-bold tracking-tight mb-1">
                  {monthlyStorageTotalGb.toFixed(2)} <span className="text-xl text-emerald-200 font-medium">GB</span>
                </div>
                <div className="text-sm text-emerald-100">30-day projected storage</div>
              </div>
            </div>

            {/* License Utilization */}
            <div className="bg-gradient-to-br from-indigo-800 to-violet-950 p-6 shadow-sm text-white border border-indigo-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-900/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-indigo-200">Monthly License Utilization</h3>
                <PieChart className="w-5 h-5 text-indigo-300" />
              </div>
              <div className="flex items-end justify-between mb-3">
                <div className="text-4xl font-bold tracking-tight">
                  {monthlyUtilizationPercent.toFixed(2)} <span className="text-xl text-indigo-300 font-medium">%</span>
                </div>
                <div className="text-sm text-indigo-300 mb-1">
                  of {monthlyLicenseQuotaGb} GB/month limit
                </div>
              </div>
              {/* Progress Bar */}
              <div className="h-3 w-full bg-indigo-950/50 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 shadow-sm ${
                    monthlyUtilizationPercent > 100 ? 'bg-red-500' : monthlyUtilizationPercent > 80 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(monthlyUtilizationPercent, 100)}%` }}
                />
              </div>
              {monthlyUtilizationPercent > 100 && (
                 <p className="text-xs text-red-300 mt-3 flex items-center gap-1 font-medium bg-red-900/30 p-2 rounded">
                   <AlertTriangle className="w-4 h-4" /> This data source alone exceeds your entire monthly license quota!
                 </p>
              )}
            </div>

            {/* Calculation Breakdown */}
            <div className="bg-white shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-800 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-slate-500" />
                  Calculation Breakdown
                </h3>
              </div>
              <div className="p-6 space-y-6">

                {/* Step 1 */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">1. Poll Events per Day</span>
                    <span className="font-bold text-slate-900">{eventsPerDay.toLocaleString()} events/day</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {jobs.toLocaleString()} jobs × {intervalsPerDay.toFixed(0)} polls/day (every {safeInterval} min).
                  </p>
                </div>

                {/* Step 2 */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">2. Base Raw Data Volume</span>
                    <span className="font-bold text-slate-900">{dailyRawMbBase.toFixed(2)} MB/day</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {payloadSizeKb} KB/poll × {intervalsPerDay.toFixed(0)} polls ÷ 1024 = {dailyRawMbBase.toFixed(2)} MB.
                    This is the baseline for storage ratio calculations.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">3. Daily License Volume</span>
                    <span className="font-bold text-blue-600">{licenseVolumeMb.toFixed(1)} MB</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {dailyRawMbBase.toFixed(2)} MB × (1 + {overheadPercent}% overhead) = {licenseVolumeMb.toFixed(1)} MB.
                    Overhead accounts for {ingestionMethod === 'api' ? 'JSON/HEC envelope wrapping' : 'UF metadata headers'}.
                  </p>
                </div>

                {/* Step 4 — FIX #1 clearly documented */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="font-medium text-slate-700">4. Storage Requirements</span>
                    <span className="font-bold text-slate-900">{dailyStorageTotalMb.toFixed(1)} MB / day</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Applied to raw volume ({dailyRawMbBase.toFixed(2)} MB), not license volume — overhead does not inflate on-disk storage.
                  </p>

                  {/* Storage Visual Bar */}
                  <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden mb-2">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${(storageRawMb / dailyStorageTotalMb) * 100}%` }}
                    />
                    <div
                      className="bg-indigo-500 h-full transition-all duration-500"
                      style={{ width: `${(storageMetaMb / dailyStorageTotalMb) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <div className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                      Compressed Raw ({rawStoragePercent}%): {storageRawMb.toFixed(1)} MB
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                      Metadata ({metaStoragePercent}%): {storageMetaMb.toFixed(1)} MB
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Retention Forecast */}
            <div className="bg-white p-6 shadow-sm border border-slate-200 flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300">
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center mb-1">
                  <HardDrive className="w-5 h-5 mr-2 text-slate-500" />
                  Total Indexed Storage Estimate
                </h3>
                <p className="text-sm text-slate-500">Required disk space for {retentionDays} days of retention.</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">
                  {totalRetentionGb.toFixed(2)} <span className="text-lg text-slate-500">GB</span>
                </div>
                <div className="text-xs text-slate-400">Total Size on Disk</div>
              </div>
            </div>

          </div>
        </div>

        {/* References Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-600 pb-8">
          <h4 className="font-semibold text-slate-800 mb-3 text-base">References & Methodology</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p>
                <strong className="text-slate-700">Storage Sizing Ratios:</strong> Standard Splunk guidance estimates that indexed data will consume approximately <strong>50%</strong> of the original raw data volume on disk. This breaks down into compressed raw data (~15%) and index metadata/tsidx files (~35%).
              </p>
              <a 
                href="https://docs.splunk.com/Documentation/Splunk/latest/Capacity/Estimateyourstoragerequirements" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                Splunk Capacity Planning: Storage Requirements <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
            <div className="space-y-3">
              <p>
                <strong className="text-slate-700">License Overhead:</strong> Splunk meters license usage based on the incoming data stream, including structural overhead. Universal Forwarders strip JSON and add lightweight headers (~12%). API/HEC endpoints retain JSON envelopes, resulting in higher structural bloat (~25%).
              </p>
              <a 
                href="https://docs.splunk.com/Documentation/Splunk/latest/Admin/HowSplunklicensingworks" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                Splunk Admin: How Licensing Works <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
          <div className="mt-6 p-4 bg-slate-100 rounded-lg text-xs text-slate-500">
            <strong>Disclaimer:</strong> This tool provides baseline architectural estimates. Actual Splunk consumption varies based on the specific cardinality of your data, the exact structure of JSON payloads, and enterprise architecture settings (such as Indexer Clustering Replication Factor, which acts as a direct multiplier on required disk storage).
          </div>
        </div>

      </div>
    </div>
  );
}
