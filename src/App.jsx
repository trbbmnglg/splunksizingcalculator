import { useState, useRef, useMemo, useCallback } from 'react';
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

  // Utilization thresholds tied to brand palette (no green/amber — use purple spectrum + pink).
  const utilBarColor = metrics.monthlyUtilizationPercent > 100
    ? 'bg-accenture-pink'
    : metrics.monthlyUtilizationPercent > 80
      ? 'bg-accenture-purple-light'
      : 'bg-accenture-purple';

  return (
    <div className="min-h-screen bg-accenture-gray-off-white text-black p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex items-center gap-3 pb-6 border-b border-accenture-gray-light">
          <div className="p-3 bg-accenture-purple">
            <Calculator className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black">Splunk sizing calculator</h1>
            <p className="text-sm text-accenture-gray-dark">Enterprise estimation tool</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Inputs */}
          <div className="lg:col-span-5 space-y-6">

            <section className="bg-white p-6 border border-accenture-gray-light">
              <h2 className="text-lg font-semibold tracking-tight mb-5 flex items-center text-black">
                <Activity className="w-5 h-5 mr-2 text-accenture-purple" aria-hidden="true" />
                Data source parameters
              </h2>
              <div className="space-y-4">

                {/* Ingestion Method Toggle */}
                <fieldset className="mb-2">
                  <legend className="block text-sm font-medium text-accenture-gray-dark mb-2">Ingestion method</legend>
                  <div className="flex gap-2" role="radiogroup">
                    {[
                      { key: INGESTION_METHODS.API, label: 'API (HEC / JSON)' },
                      { key: INGESTION_METHODS.UF, label: 'Universal forwarder' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={ingestionMethod === key}
                        onClick={() => setIngestionMethod(key)}
                        className={`flex-1 py-2 px-4 text-sm font-medium transition-colors border ${
                          ingestionMethod === key
                            ? 'bg-accenture-purple-lightest border-accenture-purple text-accenture-purple-darkest'
                            : 'bg-white border-accenture-gray-light text-accenture-gray-dark hover:border-accenture-purple hover:text-black'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <NumberInput
                  label="Number of events (per poll)"
                  field="events"
                  value={events}
                  onChange={handleEventsChange}
                  activeField={activeField}
                  onFocus={focusField}
                  onBlur={blurField}
                  min={0}
                />
                <NumberInput
                  label="Polling interval (minutes)"
                  field="interval"
                  value={intervalMinutes}
                  onChange={numChange(setIntervalMinutes)}
                  activeField={activeField}
                  onFocus={focusField}
                  onBlur={blurField}
                  min={1}
                  className={intervalWarning ? 'border-accenture-pink focus:ring-accenture-pink' : ''}
                />
                <NumberInput
                  label="Payload size per poll batch (KB)"
                  field="payloadSize"
                  value={payloadSizeKb}
                  activeField={activeField}
                  onFocus={focusField}
                  onBlur={blurField}
                  readOnly
                />

                {/* File Upload */}
                <div className="pt-2 border-t border-accenture-gray-light">
                  <label className="block text-sm font-medium text-accenture-gray-dark mb-2" htmlFor="sample-upload">
                    Calculate exact size from file
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
                        ? 'border-accenture-purple bg-accenture-purple-lightest text-accenture-purple-darkest hover:bg-accenture-purple-light'
                        : 'border-accenture-gray-light bg-white text-accenture-gray-dark hover:border-accenture-purple hover:text-accenture-purple-dark'
                    }`}
                  >
                    {uploadedFileName ? (
                      <>
                        <FileCheck className="w-6 h-6 mb-2 text-accenture-purple-dark" aria-hidden="true" />
                        <span className="font-semibold text-accenture-purple-darkest">{uploadedFileName}</span>
                        <span className="text-xs text-accenture-purple-dark mt-1 font-medium">Size captured: {payloadSizeKb} KB</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mb-2 text-accenture-gray-dark" aria-hidden="true" />
                        <span className="font-semibold">Upload sample payload</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 border border-accenture-gray-light">
              <h2 className="text-lg font-semibold tracking-tight mb-5 flex items-center text-black">
                <Settings className="w-5 h-5 mr-2 text-accenture-purple" aria-hidden="true" />
                Advanced settings
              </h2>

              {/* General Constraints */}
              <div className="space-y-4 mb-6 pb-6 border-b border-accenture-gray-light">
                <h3 className="text-xs font-medium text-accenture-purple uppercase tracking-[0.14em] mb-2 flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-2" aria-hidden="true" /> General constraints
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="Monthly quota (GB)" field="quota" value={monthlyLicenseQuotaGb} onChange={numChange(setMonthlyLicenseQuotaGb)} activeField={activeField} onFocus={focusField} onBlur={blurField} />
                  <NumberInput label="Peak buffer (multi.)" field="peakBuffer" value={peakMultiplier} onChange={(e) => setPeakMultiplier(Number(e.target.value) || 1)} activeField={activeField} onFocus={focusField} onBlur={blurField} step="0.1" min={1.0} />
                </div>
              </div>

              {/* Enterprise Clustering */}
              <div className="space-y-4 mb-6 pb-6 border-b border-accenture-gray-light">
                <h3 className="text-xs font-medium text-accenture-purple uppercase tracking-[0.14em] mb-2 flex items-center">
                  <Cpu className="w-3.5 h-3.5 mr-2" aria-hidden="true" /> Enterprise clustering
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="Replication factor (RF)" field="rf" value={replicationFactor} onChange={numChange(setReplicationFactor)} activeField={activeField} onFocus={focusField} onBlur={blurField} min={1} max={10} />
                  <NumberInput label="Search factor (SF)" field="sf" value={searchFactor} onChange={numChange(setSearchFactor)} activeField={activeField} onFocus={focusField} onBlur={blurField} min={1} max={10} />
                </div>
              </div>

              {/* Storage & Tiering */}
              <div className="space-y-4">
                <h3 className="text-xs font-medium text-accenture-purple uppercase tracking-[0.14em] mb-2 flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-2" aria-hidden="true" /> Storage &amp; tiering
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="Total retention (days)" field="retention" value={retentionDays} onChange={numChange(setRetentionDays)} activeField={activeField} onFocus={focusField} onBlur={blurField} />
                  <NumberInput label="Hot/warm (days)" field="hotWarm" value={hotWarmDays} onChange={numChange(setHotWarmDays)} activeField={activeField} onFocus={focusField} onBlur={blurField} max={retentionDays} />
                  <NumberInput label="Raw ratio (%)" field="rawRatio" value={rawStoragePercent} onChange={numChange(setRawStoragePercent)} activeField={activeField} onFocus={focusField} onBlur={blurField} />
                  <NumberInput label="Metadata ratio (%)" field="metaRatio" value={metaStoragePercent} onChange={numChange(setMetaStoragePercent)} activeField={activeField} onFocus={focusField} onBlur={blurField} />
                </div>
              </div>
            </section>
          </div>

          {/* Results */}
          <div className="lg:col-span-7 space-y-6">

            <div className="flex justify-end gap-3">
              <ExportButton onClick={handlePNG} icon={Camera} label={exporting ? 'Exporting…' : 'Export PNG report'} disabled={exporting} variant="primary" />
              <ExportButton onClick={handleCSV} icon={Download} label="Export CSV report" variant="secondary" />
            </div>

            <div ref={exportRef} className="space-y-6 p-4 -m-4 bg-accenture-gray-off-white">

              {/* Top Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard title="Daily license volume" value={metrics.licenseVolumeMb.toFixed(1)} unit="MB" subtitle={`${metrics.licenseVolumeGb.toFixed(4)} GB / day`} icon={Server} colorScheme="purple" />
                <MetricCard title="Daily physical storage" value={metrics.dailyStorageTotalMb.toFixed(1)} unit="MB" subtitle={`Incl. RF(${replicationFactor}) and SF(${searchFactor})`} icon={Database} colorScheme="purple-dark" />
                <MetricCard title="Monthly license" value={metrics.monthlyLicenseVolumeGb.toFixed(2)} unit="GB" subtitle="30-day projected volume" icon={Server} colorScheme="purple-darkest" />
                <MetricCard title="Monthly storage" value={metrics.monthlyStorageTotalGb.toFixed(2)} unit="GB" subtitle="30-day physical projection" icon={Database} colorScheme="black" />
              </div>

              {/* License Utilization */}
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
                <div className="h-3 w-full bg-[#1a1a1a] overflow-hidden" role="progressbar" aria-valuenow={Math.min(metrics.monthlyUtilizationPercent, 100).toFixed(0)} aria-valuemin="0" aria-valuemax="100">
                  <div
                    className={`h-full transition-all duration-500 ${utilBarColor}`}
                    style={{ width: `${Math.min(metrics.monthlyUtilizationPercent, 100)}%` }}
                  />
                </div>
                {metrics.monthlyUtilizationPercent > 100 && (
                  <p className="text-xs text-accenture-pink mt-3 flex items-center gap-1.5 font-medium bg-[#1a1a1a] p-2.5" role="alert">
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" /> This data source exceeds your entire monthly license quota.
                  </p>
                )}
              </div>

              {/* Calculation Breakdown */}
              <section className="bg-white border border-accenture-gray-light overflow-hidden">
                <div className="px-6 py-4 border-b border-accenture-gray-light bg-accenture-gray-off-white">
                  <h3 className="font-semibold tracking-tight text-black flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-accenture-purple" aria-hidden="true" />
                    Calculation breakdown
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-black">1. Events captured</span>
                      <span className="font-semibold text-black">{metrics.eventsPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })} events/day</span>
                    </div>
                    <p className="text-xs text-accenture-gray-dark">
                      {events.toLocaleString()} events captured {metrics.intervalsPerDay.toFixed(0)} times per day (every {intervalMinutes} min).
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-black">2. Base raw data volume</span>
                      <span className="font-semibold text-black">{metrics.dailyRawKbBase.toLocaleString(undefined, { maximumFractionDigits: 0 })} KB</span>
                    </div>
                    <p className="text-xs text-accenture-gray-dark">
                      {payloadSizeKb} KB per poll &times; {metrics.intervalsPerDay.toFixed(0)} intervals{peakMultiplier > 1 ? ` \u00d7 ${peakMultiplier} peak buffer` : ''}.
                    </p>
                  </div>

                  <div className="border-t border-accenture-gray-light pt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-black">3. Daily license volume</span>
                      <span className="font-semibold text-accenture-purple-dark">{metrics.licenseVolumeMb.toFixed(1)} MB</span>
                    </div>
                    <p className="text-xs text-accenture-gray-dark">
                      Raw event data converted from KB to MB. Splunk meters license on raw event bytes only.
                    </p>
                  </div>

                  <div className="border-t border-accenture-gray-light pt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-black">4. Planned volume (with buffer)</span>
                      <span className="font-semibold text-black">{metrics.plannedVolumeMb.toFixed(1)} MB</span>
                    </div>
                    <p className="text-xs text-accenture-gray-dark">
                      License volume + {metrics.overheadPercent}% planning buffer for data expansion during parsing (field extraction, linebreaking).
                    </p>
                  </div>

                  <div className="border-t border-accenture-gray-light pt-4">
                    <div className="flex justify-between text-sm mb-3">
                      <span className="font-medium text-black">5. Physical storage required</span>
                      <span className="font-semibold text-black">{metrics.dailyStorageTotalMb.toFixed(1)} MB / day</span>
                    </div>
                    <div className="h-4 w-full bg-accenture-gray-off-white flex overflow-hidden mb-2 border border-accenture-gray-light" role="img" aria-label={`Raw: ${metrics.storageRawMb.toFixed(1)} MB, Metadata: ${metrics.storageMetaMb.toFixed(1)} MB`}>
                      <div className="bg-accenture-purple h-full transition-all duration-500" style={{ width: `${metrics.rawBarPercent}%` }} />
                      <div className="bg-accenture-purple-darkest h-full transition-all duration-500" style={{ width: `${metrics.metaBarPercent}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-accenture-gray-dark">
                      <div className="flex items-center">
                        <span className="w-2.5 h-2.5 bg-accenture-purple mr-2" aria-hidden="true"></span>
                        Compressed raw ({rawStoragePercent}% &times; RF:{replicationFactor}): {metrics.storageRawMb.toFixed(1)} MB
                      </div>
                      <div className="flex items-center">
                        <span className="w-2.5 h-2.5 bg-accenture-purple-darkest mr-2" aria-hidden="true"></span>
                        Metadata ({metaStoragePercent}% &times; SF:{searchFactor}): {metrics.storageMetaMb.toFixed(1)} MB
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Storage Tiering */}
              <section className="bg-white border border-accenture-gray-light flex flex-col">
                <div className="p-6 border-b border-accenture-gray-light flex items-center justify-between bg-accenture-gray-off-white">
                  <div>
                    <h3 className="font-semibold tracking-tight text-black flex items-center mb-1">
                      <HardDrive className="w-5 h-5 mr-2 text-accenture-purple" aria-hidden="true" />
                      Tiered storage requirements
                    </h3>
                    <p className="text-sm text-accenture-gray-dark">Physical disk required for {retentionDays} total days of retention.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-semibold tracking-tight text-black">
                      {metrics.totalRetentionGb.toFixed(2)} <span className="text-lg text-accenture-gray-dark font-medium">GB</span>
                    </div>
                    <div className="text-xs text-accenture-gray-dark font-medium">Total physical disk</div>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center p-4 border border-accenture-purple-light bg-accenture-purple-lightest">
                    <div className="p-3 bg-accenture-purple text-white mr-4">
                      <Layers className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-xs text-accenture-purple-darkest font-medium uppercase tracking-[0.12em] mb-1">Hot / warm tier · {metrics.actualHotWarmDays} days</div>
                      <div className="text-2xl font-semibold tracking-tight text-black">{metrics.hotWarmRetentionGb.toFixed(2)} GB</div>
                      <div className="text-xs text-accenture-gray-dark mt-1">High-IOPS storage (NVMe/SSD)</div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 border border-accenture-gray-light bg-accenture-gray-off-white">
                    <div className="p-3 bg-accenture-gray-dark text-white mr-4">
                      <Database className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-xs text-accenture-gray-dark font-medium uppercase tracking-[0.12em] mb-1">Cold tier · {Math.max(0, retentionDays - hotWarmDays)} days</div>
                      <div className="text-2xl font-semibold tracking-tight text-black">{metrics.coldRetentionGb.toFixed(2)} GB</div>
                      <div className="text-xs text-accenture-gray-dark mt-1">Standard storage (HDD/S3)</div>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>

        {/* References Footer */}
        <footer className="mt-12 pt-8 border-t border-accenture-gray-light text-sm text-accenture-gray-dark pb-8">
          <h4 className="font-semibold tracking-tight text-black mb-3 text-base">References &amp; methodology</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p>
                <strong className="text-black font-medium">Storage sizing ratios:</strong> Standard Splunk guidance estimates that indexed data will consume approximately <strong className="text-black">50%</strong> of the original raw data volume on disk. This breaks down into compressed raw data (~15%) and index metadata/tsidx files (~35%).
              </p>
              <a
                href="https://docs.splunk.com/Documentation/Splunk/latest/Capacity/Estimateyourstoragerequirements"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-accenture-purple-dark hover:text-accenture-purple hover:underline font-medium"
              >
                Splunk capacity planning: storage requirements <ExternalLink className="w-3 h-3 ml-1" aria-hidden="true" />
              </a>
            </div>
            <div className="space-y-3">
              <p>
                <strong className="text-black font-medium">License overhead:</strong> Splunk meters license usage based on the incoming data stream, including structural overhead. Universal forwarders strip JSON and add lightweight headers (~12%). API/HEC endpoints retain JSON envelopes, resulting in higher structural bloat (~25%).
              </p>
              <a
                href="https://docs.splunk.com/Documentation/Splunk/latest/Admin/HowSplunklicensingworks"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-accenture-purple-dark hover:text-accenture-purple hover:underline font-medium"
              >
                Splunk admin: how licensing works <ExternalLink className="w-3 h-3 ml-1" aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="mt-6 p-4 bg-white text-xs text-accenture-gray-dark border-l-4 border-accenture-purple">
            <strong className="text-black">Disclaimer:</strong> This tool provides baseline architectural estimates. Actual Splunk consumption varies based on the specific cardinality of your data, the exact structure of JSON payloads, and enterprise architecture settings (such as indexer clustering replication factor, which acts as a direct multiplier on required disk storage).
          </div>
        </footer>

      </div>
    </div>
  );
}
