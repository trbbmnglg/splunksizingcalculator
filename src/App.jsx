import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  Calculator, Database, Server, Settings, Activity, Clock, HardDrive,
  AlertTriangle, PieChart, ExternalLink, Upload, FileCheck, Download,
  Layers, Cpu, Camera,
} from 'lucide-react';

import NumberInput from './components/NumberInput';
import MetricCard from './components/MetricCard';
import ExportButton from './components/ExportButton';
import { computeSizing } from './utils/calculations';
import { exportToCSV } from './utils/exportCsv';
import { exportToPNG } from './utils/exportPng';
import { parseFileEvents } from './utils/fileParser';
import {
  DEFAULT_KB_PER_1K_EVENTS,
  MAX_UPLOAD_BYTES,
  INGESTION_METHODS,
} from './utils/constants';

export default function App() {
  const [activeField, setActiveField] = useState(null);
  const [events, setEvents] = useState(1000);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [payloadSizeKb, setPayloadSizeKb] = useState(DEFAULT_KB_PER_1K_EVENTS);
  const [ingestionMethod, setIngestionMethod] = useState(INGESTION_METHODS.API);
  const [rawStoragePercent, setRawStoragePercent] = useState(15);
  const [metaStoragePercent, setMetaStoragePercent] = useState(35);
  const [retentionDays, setRetentionDays] = useState(30);
  const [monthlyLicenseQuotaGb, setMonthlyLicenseQuotaGb] = useState(300);
  const [replicationFactor, setReplicationFactor] = useState(1);
  const [searchFactor, setSearchFactor] = useState(1);
  const [hotWarmDays, setHotWarmDays] = useState(7);
  const [peakMultiplier, setPeakMultiplier] = useState(1.0);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [exporting, setExporting] = useState(false);

  const fileInputRef = useRef(null);
  const exportRef = useRef(null);

  const intervalWarning = intervalMinutes <= 0;

  const metrics = useMemo(
    () =>
      computeSizing({
        events,
        intervalMinutes,
        payloadSizeKb,
        ingestionMethod,
        rawStoragePercent,
        metaStoragePercent,
        retentionDays,
        monthlyLicenseQuotaGb,
        replicationFactor,
        searchFactor,
        hotWarmDays,
        peakMultiplier,
      }),
    [
      events, intervalMinutes, payloadSizeKb, ingestionMethod,
      rawStoragePercent, metaStoragePercent, retentionDays,
      monthlyLicenseQuotaGb, replicationFactor, searchFactor,
      hotWarmDays, peakMultiplier,
    ],
  );

  const handleEventsChange = useCallback(
    (e) => {
      const newEvents = Math.max(0, Number(e.target.value) || 0);
      if (events > 0 && newEvents > 0) {
        setPayloadSizeKb(+(payloadSizeKb * (newEvents / events)).toFixed(2));
      } else if (events === 0 && newEvents > 0) {
        setPayloadSizeKb((newEvents / 1000) * DEFAULT_KB_PER_1K_EVENTS);
      }
      setEvents(newEvents);
    },
    [events, payloadSizeKb],
  );

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      alert(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Please upload a sample under 50 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (readEvent) => {
      const estimatedEvents = parseFileEvents(readEvent.target.result);
      setPayloadSizeKb(+(file.size / 1024).toFixed(2));
      setEvents(estimatedEvents);
      setUploadedFileName(file.name);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }, []);

  const handleCSV = useCallback(() => {
    exportToCSV(
      { events, intervalMinutes, payloadSizeKb, peakMultiplier, replicationFactor, searchFactor, retentionDays },
      metrics,
    );
  }, [events, intervalMinutes, payloadSizeKb, peakMultiplier, replicationFactor, searchFactor, retentionDays, metrics]);

  const handlePNG = useCallback(async () => {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    try {
      await exportToPNG(exportRef.current);
    } catch (err) {
      console.error('Failed to export PNG:', err);
      alert('Failed to export image. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  const focusField = useCallback((field) => setActiveField(field), []);
  const blurField = useCallback(() => setActiveField(null), []);
  const numChange = useCallback((setter) => (e) => setter(Math.max(0, Number(e.target.value) || 0)), []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex items-center space-x-3 pb-6 border-b border-slate-200">
          <div className="p-3 bg-blue-600 shadow-sm rounded-lg">
            <Calculator className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Splunk Sizing Calculator</h1>
            <p className="text-sm text-slate-500 font-medium">Enterprise Estimation Tool</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Inputs */}
          <div className="lg:col-span-5 space-y-6">

            <section className="bg-white p-6 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-slate-800">
                <Activity className="w-5 h-5 mr-2 text-blue-500" aria-hidden="true" />
                Data Source Parameters
              </h2>
              <div className="space-y-4">

                {/* Ingestion Method Toggle */}
                <fieldset className="mb-2">
                  <legend className="block text-sm font-medium text-slate-600 mb-2">Ingestion Method</legend>
                  <div className="flex space-x-2" role="radiogroup">
                    {[
                      { key: INGESTION_METHODS.API, label: 'API (HEC / JSON)' },
                      { key: INGESTION_METHODS.UF, label: 'Universal Forwarder' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={ingestionMethod === key}
                        onClick={() => setIngestionMethod(key)}
                        className={`flex-1 py-2 px-4 text-sm font-medium transition-colors border ${
                          ingestionMethod === key
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <NumberInput
                  label="Number of Events (per poll)"
                  field="events"
                  value={events}
                  onChange={handleEventsChange}
                  activeField={activeField}
                  onFocus={focusField}
                  onBlur={blurField}
                  min={0}
                />
                <NumberInput
                  label="Polling Interval (Minutes)"
                  field="interval"
                  value={intervalMinutes}
                  onChange={numChange(setIntervalMinutes)}
                  activeField={activeField}
                  onFocus={focusField}
                  onBlur={blurField}
                  min={1}
                  className={intervalWarning ? 'border-amber-400 focus:ring-amber-400' : ''}
                />
                <NumberInput
                  label="Payload Size per Poll Batch (KB)"
                  field="payloadSize"
                  value={payloadSizeKb}
                  activeField={activeField}
                  onFocus={focusField}
                  onBlur={blurField}
                  readOnly
                />

                {/* File Upload */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-600 mb-2" htmlFor="sample-upload">
                    Calculate Exact Size from File
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="sample-upload"
                    accept=".json,.log,.txt,.csv"
                  />
                  <label
                    htmlFor="sample-upload"
                    className={`flex flex-col items-center justify-center w-full px-4 py-4 border-2 border-dashed transition-colors cursor-pointer text-sm ${
                      uploadedFileName
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border-blue-300 bg-blue-50/50 text-blue-600 hover:bg-blue-50 hover:border-blue-500'
                    }`}
                  >
                    {uploadedFileName ? (
                      <>
                        <FileCheck className="w-6 h-6 mb-2 text-emerald-500" aria-hidden="true" />
                        <span className="font-semibold text-emerald-800">{uploadedFileName}</span>
                        <span className="text-xs text-emerald-600 mt-1 font-medium">Size captured: {payloadSizeKb} KB</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mb-2 text-blue-500" aria-hidden="true" />
                        <span className="font-semibold">Upload Sample Payload</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-slate-800">
                <Settings className="w-5 h-5 mr-2 text-slate-500" aria-hidden="true" />
                Advanced Settings
              </h2>

              {/* General Constraints */}
              <div className="space-y-4 mb-6 pb-6 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  <Activity className="w-4 h-4 mr-2" aria-hidden="true" /> General Constraints
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="Monthly Quota (GB)" field="quota" value={monthlyLicenseQuotaGb} onChange={numChange(setMonthlyLicenseQuotaGb)} activeField={activeField} onFocus={focusField} onBlur={blurField} />
                  <NumberInput label="Peak Buffer (Multi.)" field="peakBuffer" value={peakMultiplier} onChange={(e) => setPeakMultiplier(Number(e.target.value) || 1)} activeField={activeField} onFocus={focusField} onBlur={blurField} step="0.1" min={1.0} />
                </div>
              </div>

              {/* Enterprise Clustering */}
              <div className="space-y-4 mb-6 pb-6 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  <Cpu className="w-4 h-4 mr-2" aria-hidden="true" /> Enterprise Clustering
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="Replication Factor (RF)" field="rf" value={replicationFactor} onChange={numChange(setReplicationFactor)} activeField={activeField} onFocus={focusField} onBlur={blurField} min={1} max={10} />
                  <NumberInput label="Search Factor (SF)" field="sf" value={searchFactor} onChange={numChange(setSearchFactor)} activeField={activeField} onFocus={focusField} onBlur={blurField} min={1} max={10} />
                </div>
              </div>

              {/* Storage & Tiering */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  <Layers className="w-4 h-4 mr-2" aria-hidden="true" /> Storage & Tiering
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="Total Retention (Days)" field="retention" value={retentionDays} onChange={numChange(setRetentionDays)} activeField={activeField} onFocus={focusField} onBlur={blurField} />
                  <NumberInput label="Hot/Warm (Days)" field="hotWarm" value={hotWarmDays} onChange={numChange(setHotWarmDays)} activeField={activeField} onFocus={focusField} onBlur={blurField} max={retentionDays} />
                  <NumberInput label="Raw Ratio (%)" field="rawRatio" value={rawStoragePercent} onChange={numChange(setRawStoragePercent)} activeField={activeField} onFocus={focusField} onBlur={blurField} />
                  <NumberInput label="Metadata Ratio (%)" field="metaRatio" value={metaStoragePercent} onChange={numChange(setMetaStoragePercent)} activeField={activeField} onFocus={focusField} onBlur={blurField} />
                </div>
              </div>
            </section>
          </div>

          {/* Results */}
          <div className="lg:col-span-7 space-y-6">

            <div className="flex justify-end space-x-3">
              <ExportButton onClick={handlePNG} icon={Camera} label={exporting ? 'Exporting...' : 'Export PNG Report'} disabled={exporting} className="bg-indigo-600 hover:bg-indigo-700" />
              <ExportButton onClick={handleCSV} icon={Download} label="Export CSV Report" className="bg-slate-800 hover:bg-slate-700" />
            </div>

            <div ref={exportRef} className="space-y-6 p-4 -m-4 bg-slate-50 rounded-xl">

              {/* Top Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard title="Daily License Volume" value={metrics.licenseVolumeMb.toFixed(1)} unit="MB" subtitle={`${metrics.licenseVolumeGb.toFixed(4)} GB / day`} icon={Server} colorScheme="blue" />
                <MetricCard title="Daily Physical Storage" value={metrics.dailyStorageTotalMb.toFixed(1)} unit="MB" subtitle={`Incl. RF(${replicationFactor}) and SF(${searchFactor})`} icon={Database} colorScheme="purple" />
                <MetricCard title="Monthly License" value={metrics.monthlyLicenseVolumeGb.toFixed(2)} unit="GB" subtitle="30-day projected volume" icon={Server} colorScheme="rose" />
                <MetricCard title="Monthly Storage" value={metrics.monthlyStorageTotalGb.toFixed(2)} unit="GB" subtitle="30-day physical projection" icon={Database} colorScheme="emerald" />
              </div>

              {/* License Utilization */}
              <div className="bg-gradient-to-br from-indigo-800 to-violet-950 p-6 shadow-sm text-white border border-indigo-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-900/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-indigo-200">Monthly License Utilization</h3>
                  <PieChart className="w-5 h-5 text-indigo-300" aria-hidden="true" />
                </div>
                <div className="flex items-end justify-between mb-3">
                  <div className="text-4xl font-bold tracking-tight">
                    {metrics.monthlyUtilizationPercent.toFixed(2)} <span className="text-xl text-indigo-300 font-medium">%</span>
                  </div>
                  <div className="text-sm text-indigo-300 mb-1">of {monthlyLicenseQuotaGb} GB/month limit</div>
                </div>
                <div className="h-3 w-full bg-indigo-950/50 overflow-hidden" role="progressbar" aria-valuenow={Math.min(metrics.monthlyUtilizationPercent, 100).toFixed(0)} aria-valuemin="0" aria-valuemax="100">
                  <div
                    className={`h-full transition-all duration-500 shadow-sm ${
                      metrics.monthlyUtilizationPercent > 100 ? 'bg-red-500' : metrics.monthlyUtilizationPercent > 80 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(metrics.monthlyUtilizationPercent, 100)}%` }}
                  />
                </div>
                {metrics.monthlyUtilizationPercent > 100 && (
                  <p className="text-xs text-red-300 mt-3 flex items-center gap-1 font-medium bg-red-900/30 p-2" role="alert">
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" /> This data source exceeds your entire monthly license quota!
                  </p>
                )}
              </div>

              {/* Calculation Breakdown */}
              <section className="bg-white shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-semibold text-slate-800 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-slate-500" aria-hidden="true" />
                    Calculation Breakdown
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">1. Events Captured</span>
                      <span className="font-bold text-slate-900">{metrics.eventsPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })} events/day</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {events.toLocaleString()} events captured {metrics.intervalsPerDay.toFixed(0)} times per day (every {intervalMinutes} min).
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">2. Base Raw Data Volume</span>
                      <span className="font-bold text-slate-900">{metrics.dailyRawKbBase.toLocaleString(undefined, { maximumFractionDigits: 0 })} KB</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {payloadSizeKb} KB per poll &times; {metrics.intervalsPerDay.toFixed(0)} intervals{peakMultiplier > 1 ? ` \u00d7 ${peakMultiplier} peak buffer` : ''}.
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">3. Daily License Volume</span>
                      <span className="font-bold text-blue-600">{metrics.licenseVolumeMb.toFixed(1)} MB</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Converted from KB to MB, including {metrics.overheadPercent}% sizing buffer/overhead.
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex justify-between text-sm mb-3">
                      <span className="font-medium text-slate-700">4. Physical Storage Required</span>
                      <span className="font-bold text-slate-900">{metrics.dailyStorageTotalMb.toFixed(1)} MB / day</span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 flex overflow-hidden mb-2" role="img" aria-label={`Raw: ${metrics.storageRawMb.toFixed(1)} MB, Metadata: ${metrics.storageMetaMb.toFixed(1)} MB`}>
                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${metrics.rawBarPercent}%` }} />
                      <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${metrics.metaBarPercent}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-emerald-500 mr-2" aria-hidden="true"></span>
                        Compressed Raw ({rawStoragePercent}% &times; RF:{replicationFactor}): {metrics.storageRawMb.toFixed(1)} MB
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-indigo-500 mr-2" aria-hidden="true"></span>
                        Metadata ({metaStoragePercent}% &times; SF:{searchFactor}): {metrics.storageMetaMb.toFixed(1)} MB
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Storage Tiering */}
              <section className="bg-white shadow-sm border border-slate-200 flex flex-col transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="font-semibold text-slate-800 flex items-center mb-1">
                      <HardDrive className="w-5 h-5 mr-2 text-slate-500" aria-hidden="true" />
                      Tiered Storage Requirements
                    </h3>
                    <p className="text-sm text-slate-500">Physical disk required for {retentionDays} total days of retention.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900">
                      {metrics.totalRetentionGb.toFixed(2)} <span className="text-lg text-slate-500">GB</span>
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Total Physical Disk</div>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center p-4 bg-orange-50 border border-orange-100 rounded-lg">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-full mr-4">
                      <Layers className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-sm text-orange-600 font-semibold mb-1">Hot / Warm Tier ({metrics.actualHotWarmDays} Days)</div>
                      <div className="text-2xl font-bold text-slate-800">{metrics.hotWarmRetentionGb.toFixed(2)} GB</div>
                      <div className="text-xs text-slate-500 mt-1">High-IOPS Storage (NVMe/SSD)</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-sky-50 border border-sky-100 rounded-lg">
                    <div className="p-3 bg-sky-100 text-sky-600 rounded-full mr-4">
                      <Database className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-sm text-sky-600 font-semibold mb-1">Cold Tier ({Math.max(0, retentionDays - hotWarmDays)} Days)</div>
                      <div className="text-2xl font-bold text-slate-800">{metrics.coldRetentionGb.toFixed(2)} GB</div>
                      <div className="text-xs text-slate-500 mt-1">Standard Storage (HDD/S3)</div>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>

        {/* References Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-200 text-sm text-slate-600 pb-8">
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
                Splunk Capacity Planning: Storage Requirements <ExternalLink className="w-3 h-3 ml-1" aria-hidden="true" />
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
                Splunk Admin: How Licensing Works <ExternalLink className="w-3 h-3 ml-1" aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="mt-6 p-4 bg-slate-100 text-xs text-slate-500 border-l-4 border-slate-300">
            <strong>Disclaimer:</strong> This tool provides baseline architectural estimates. Actual Splunk consumption varies based on the specific cardinality of your data, the exact structure of JSON payloads, and enterprise architecture settings (such as Indexer Clustering Replication Factor, which acts as a direct multiplier on required disk storage).
          </div>
        </footer>

      </div>
    </div>
  );
}
