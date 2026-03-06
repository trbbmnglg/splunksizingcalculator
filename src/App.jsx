import React, { useState, useRef } from 'react';
import { Calculator, Database, Server, Settings, Activity, Clock, HardDrive, AlertTriangle, PieChart, ExternalLink, Upload, FileCheck, Download, Layers, Cpu, Info, Camera } from 'lucide-react';

// Informational Dictionary for the Modals
const fieldDescriptions = {
  events: { title: "Number of Events", desc: "The total volume of individual log lines, records, or jobs generated in a single polling cycle." },
  interval: { title: "Polling Interval", desc: "How frequently (in minutes) the data source generates this batch of events. (e.g., 5 means every 5 minutes)." },
  payloadSize: { title: "Payload Size", desc: "The physical file size of the events. Uploading a sample file will measure and calculate this perfectly for you." },
  quota: { title: "Monthly Quota", desc: "Your organization's maximum allowable Splunk ingest limit per month (used to calculate % utilization)." },
  peakBuffer: { title: "Peak Buffer", desc: "A safety multiplier for business hours. E.g., 1.2 adds 20% extra padding to account for peak traffic spikes." },
  rf: { title: "Replication Factor (RF)", desc: "Enterprise clustering setting. Defines how many identical copies of raw data are stored across your indexers for disaster recovery. Standard is 2 or 3." },
  sf: { title: "Search Factor (SF)", desc: "Enterprise clustering setting. Defines how many copies of index metadata are kept to ensure searches remain fast if a server goes down. Standard is 2." },
  retention: { title: "Total Retention", desc: "The maximum number of days this data will be stored and searchable in Splunk before it is permanently deleted." },
  hotWarm: { title: "Hot/Warm Retention", desc: "The number of days data lives on fast, expensive NVMe/SSD storage before rolling to cheaper Cold (HDD/S3) storage." },
  rawRatio: { title: "Raw Ratio", desc: "Splunk compresses raw text. 15% means 100GB of text shrinks to ~15GB on disk. Highly repetitive data compresses better." },
  metaRatio: { title: "Metadata Ratio", desc: "Splunk builds index files (tsidx) to make searches fast. This typically takes up 35% of the original file size." }
};

export default function App() {
  // Active Field tracking for Modals
  const [activeField, setActiveField] = useState(null);

  // Input State
  const [events, setEvents] = useState(1000);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [payloadSizeKb, setPayloadSizeKb] = useState(183);
  const [ingestionMethod, setIngestionMethod] = useState('api');
  
  // Advanced Settings State
  const [rawStoragePercent, setRawStoragePercent] = useState(15);
  const [metaStoragePercent, setMetaStoragePercent] = useState(35);
  const [overheadPercent, setOverheadPercent] = useState(25.0); 
  const [retentionDays, setRetentionDays] = useState(30);
  const [monthlyLicenseQuotaGb, setMonthlyLicenseQuotaGb] = useState(300);

  // Enterprise Architecture State
  const [replicationFactor, setReplicationFactor] = useState(1);
  const [searchFactor, setSearchFactor] = useState(1);
  const [hotWarmDays, setHotWarmDays] = useState(7);
  const [peakMultiplier, setPeakMultiplier] = useState(1.0);

  // File Upload State
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);
  const exportRef = useRef(null); // Reference for the PNG target area

  // Handlers
  const handleEventsChange = (e) => {
    const newEvents = Number(e.target.value);
    if (events > 0 && newEvents > 0) {
      const ratio = newEvents / events;
      setPayloadSizeKb(+(payloadSizeKb * ratio).toFixed(2));
    } else if (events === 0 && newEvents > 0) {
      setPayloadSizeKb((newEvents / 1000) * 183);
    }
    setEvents(newEvents);
  };

  const handleMethodChange = (method) => {
    setIngestionMethod(method);
    if (method === 'uf') {
      setOverheadPercent(12.11); 
    } else {
      setOverheadPercent(25.0); 
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readEvent) => {
        const content = readEvent.target.result;
        let estimatedEvents = 1;

        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            estimatedEvents = parsed.length;
          } else {
            estimatedEvents = 1;
          }
        } catch (err) {
          const lines = content.split('\n').filter(line => line.trim().length > 0);
          estimatedEvents = lines.length > 0 ? lines.length : 1;
        }

        const kbSize = file.size / 1024;
        setPayloadSizeKb(+kbSize.toFixed(2));
        setEvents(estimatedEvents);
        setUploadedFileName(file.name);
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    }
  };

  // Constants & Validations
  const MINUTES_PER_DAY = 1440;
  const intervalWarning = intervalMinutes <= 0;

  // Base Calculations
  const intervalsPerDay = MINUTES_PER_DAY / (intervalWarning ? 1 : intervalMinutes);
  const eventsPerDay = events * intervalsPerDay;
  
  // Base raw data (Buffered for Peak)
  const dailyRawKbBase = payloadSizeKb * intervalsPerDay * peakMultiplier;
  const dailyRawMbBase = dailyRawKbBase / 1024;
  
  // License Volume
  const licenseVolumeMb = dailyRawMbBase * (1 + (overheadPercent / 100));
  const licenseVolumeGb = licenseVolumeMb / 1024;

  // Storage Calculations (Factoring in Replication & Search Factors)
  const storageRawMb = licenseVolumeMb * (rawStoragePercent / 100) * replicationFactor;
  const storageMetaMb = licenseVolumeMb * (metaStoragePercent / 100) * searchFactor;
  const dailyStorageTotalMb = storageRawMb + storageMetaMb;
  const dailyStorageTotalGb = dailyStorageTotalMb / 1024;

  // Monthly Projections
  const monthlyLicenseVolumeGb = licenseVolumeGb * 30;
  const monthlyStorageTotalGb = dailyStorageTotalGb * 30;
  const monthlyUtilizationPercent = monthlyLicenseQuotaGb > 0 ? (monthlyLicenseVolumeGb / monthlyLicenseQuotaGb) * 100 : 0;

  // Retention Tiering Calculations
  const totalRetentionGb = dailyStorageTotalGb * retentionDays;
  const actualHotWarmDays = Math.min(retentionDays, hotWarmDays);
  const hotWarmRetentionGb = dailyStorageTotalGb * actualHotWarmDays;
  const coldRetentionGb = Math.max(0, totalRetentionGb - hotWarmRetentionGb);

  // CSV Export
  const exportToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Splunk Sizing Estimate Report\n\n"
      + "Metric,Value\n"
      + `Number of Events (per poll),${events}\n`
      + `Polling Interval (min),${intervalMinutes}\n`
      + `Payload Size (KB),${payloadSizeKb}\n`
      + `Peak Volume Buffer Multiplier,${peakMultiplier}x\n`
      + `Replication Factor (RF),${replicationFactor}\n`
      + `Search Factor (SF),${searchFactor}\n`
      + `Daily License Volume (MB),${licenseVolumeMb.toFixed(2)}\n`
      + `Daily Physical Storage (MB),${dailyStorageTotalMb.toFixed(2)}\n`
      + `Monthly License Volume (GB),${monthlyLicenseVolumeGb.toFixed(2)}\n`
      + `Monthly Physical Storage (GB),${monthlyStorageTotalGb.toFixed(2)}\n`
      + `Total Disk Needed (${retentionDays} Days) (GB),${totalRetentionGb.toFixed(2)}\n`
      + `Hot/Warm Disk Needed (GB),${hotWarmRetentionGb.toFixed(2)}\n`
      + `Cold Disk Needed (GB),${coldRetentionGb.toFixed(2)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "splunk_sizing_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PNG Export
  const exportToPNG = async () => {
    try {
      // Dynamically load html2canvas to avoid requiring local npm installs
      if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      if (exportRef.current) {
        const canvas = await window.html2canvas(exportRef.current, {
          backgroundColor: '#f8fafc', // Matches the Tailwind slate-50 background
          scale: 2, // High resolution for sharper text
          logging: false,
          useCORS: true
        });

        const image = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement("a");
        link.download = "splunk_sizing_visual_report.png";
        link.href = image;
        link.click();
      }
    } catch (error) {
      console.error("Failed to export PNG:", error);
      alert("Failed to export image. Please try again.");
    }
  };

  // Reusable Info Modal Component
  const InlineHelp = ({ field }) => {
    if (activeField !== field) return null;
    const info = fieldDescriptions[field];
    return (
      <div className="absolute left-0 right-0 top-full mt-2 p-3 bg-slate-800 rounded-lg shadow-xl border border-slate-700 flex items-start text-slate-200 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-1 z-50">
        <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
        <div className="text-xs leading-relaxed">
          <strong className="block mb-1 text-white font-semibold">{info.title}</strong>
          {info.desc}
        </div>
      </div>
    );
  };

  // Shared Input Styles
  const inputClass =
    'w-full px-4 py-2 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');`}</style>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center space-x-3 pb-6 border-b border-slate-200">
          <div className="p-3 bg-blue-600 shadow-sm rounded-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Splunk Sizing Calculator</h1>
            <p className="text-sm text-slate-500 font-medium">Enterprise Estimation Tool</p>
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
                <div className="mb-2">
                  <label className="block text-sm font-medium text-slate-600 mb-2">Ingestion Method</label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleMethodChange('api')}
                      className={`flex-1 py-2 px-4 text-sm font-medium transition-colors border ${
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
                      className={`flex-1 py-2 px-4 text-sm font-medium transition-colors border ${
                        ingestionMethod === 'uf' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Universal Forwarder
                    </button>
                  </div>
                </div>

                {/* Event Count */}
                <div className={`relative ${activeField === 'events' ? 'z-40' : 'z-10'}`}>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Number of Events (per poll)</label>
                  <input 
                    type="number" 
                    value={events}
                    onChange={handleEventsChange}
                    onFocus={() => setActiveField('events')}
                    onBlur={() => setActiveField(null)}
                    className={inputClass}
                  />
                  <InlineHelp field="events" />
                </div>

                {/* Polling Interval */}
                <div className={`relative ${activeField === 'interval' ? 'z-40' : 'z-10'}`}>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Polling Interval (Minutes)</label>
                  <input 
                    type="number" 
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                    onFocus={() => setActiveField('interval')}
                    onBlur={() => setActiveField(null)}
                    min={1}
                    className={`${inputClass} ${intervalWarning ? 'border-amber-400 focus:ring-amber-400' : ''}`}
                  />
                  <InlineHelp field="interval" />
                </div>

                {/* Payload Size Read-Only */}
                <div className={`relative ${activeField === 'payloadSize' ? 'z-40' : 'z-10'}`}>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Payload Size per Poll Batch (KB)
                  </label>
                  <input 
                    type="number" 
                    value={payloadSizeKb}
                    onFocus={() => setActiveField('payloadSize')}
                    onBlur={() => setActiveField(null)}
                    readOnly
                    className={`${inputClass} bg-slate-100 text-slate-500 cursor-not-allowed focus:ring-0 focus:border-slate-200`}
                  />
                  <InlineHelp field="payloadSize" />
                </div>

                {/* File Upload Zone */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-600 mb-2">Calculate Exact Size from File</label>
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
                    className={`flex flex-col items-center justify-center w-full px-4 py-4 border-2 border-dashed transition-colors cursor-pointer text-sm
                      ${uploadedFileName 
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                        : 'border-blue-300 bg-blue-50/50 text-blue-600 hover:bg-blue-50 hover:border-blue-500'}`}
                  >
                    {uploadedFileName ? (
                      <>
                        <FileCheck className="w-6 h-6 mb-2 text-emerald-500" />
                        <span className="font-semibold text-emerald-800">{uploadedFileName}</span>
                        <span className="text-xs text-emerald-600 mt-1 font-medium">Size captured: {payloadSizeKb} KB</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mb-2 text-blue-500" />
                        <span className="font-semibold">Upload Sample Payload</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-white p-6 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-slate-800">
                <Settings className="w-5 h-5 mr-2 text-slate-500" />
                Advanced Settings
              </h2>
              
              {/* Group 1: General Constraints */}
              <div className="space-y-4 mb-6 pb-6 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  <Activity className="w-4 h-4 mr-2" /> General Constraints
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`relative ${activeField === 'quota' ? 'z-40' : 'z-10'}`}>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Monthly Quota (GB)</label>
                    <input 
                      type="number" 
                      value={monthlyLicenseQuotaGb}
                      onChange={(e) => setMonthlyLicenseQuotaGb(Number(e.target.value))}
                      onFocus={() => setActiveField('quota')}
                      onBlur={() => setActiveField(null)}
                      className={inputClass}
                    />
                    <InlineHelp field="quota" />
                  </div>
                  <div className={`relative ${activeField === 'peakBuffer' ? 'z-40' : 'z-10'}`}>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Peak Buffer (Multi.)</label>
                    <input 
                      type="number" 
                      value={peakMultiplier}
                      step="0.1"
                      min="1.0"
                      onChange={(e) => setPeakMultiplier(Number(e.target.value))}
                      onFocus={() => setActiveField('peakBuffer')}
                      onBlur={() => setActiveField(null)}
                      className={inputClass}
                    />
                    <InlineHelp field="peakBuffer" />
                  </div>
                </div>
              </div>

              {/* Group 2: Enterprise Architecture */}
              <div className="space-y-4 mb-6 pb-6 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  <Cpu className="w-4 h-4 mr-2" /> Enterprise Clustering
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`relative ${activeField === 'rf' ? 'z-40' : 'z-10'}`}>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Replication Factor (RF)</label>
                    <input 
                      type="number" 
                      value={replicationFactor}
                      min="1"
                      max="10"
                      onChange={(e) => setReplicationFactor(Number(e.target.value))}
                      onFocus={() => setActiveField('rf')}
                      onBlur={() => setActiveField(null)}
                      className={inputClass}
                    />
                    <InlineHelp field="rf" />
                  </div>
                  <div className={`relative ${activeField === 'sf' ? 'z-40' : 'z-10'}`}>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Search Factor (SF)</label>
                    <input 
                      type="number" 
                      value={searchFactor}
                      min="1"
                      max="10"
                      onChange={(e) => setSearchFactor(Number(e.target.value))}
                      onFocus={() => setActiveField('sf')}
                      onBlur={() => setActiveField(null)}
                      className={inputClass}
                    />
                    <InlineHelp field="sf" />
                  </div>
                </div>
              </div>

              {/* Group 3: Storage & Tiering */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  <Layers className="w-4 h-4 mr-2" /> Storage & Tiering
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`relative ${activeField === 'retention' ? 'z-40' : 'z-10'}`}>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Total Retention (Days)</label>
                    <input 
                      type="number" 
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(Number(e.target.value))}
                      onFocus={() => setActiveField('retention')}
                      onBlur={() => setActiveField(null)}
                      className={inputClass}
                    />
                    <InlineHelp field="retention" />
                  </div>
                  <div className={`relative ${activeField === 'hotWarm' ? 'z-40' : 'z-10'}`}>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Hot/Warm (Days)</label>
                    <input 
                      type="number" 
                      value={hotWarmDays}
                      max={retentionDays}
                      onChange={(e) => setHotWarmDays(Number(e.target.value))}
                      onFocus={() => setActiveField('hotWarm')}
                      onBlur={() => setActiveField(null)}
                      className={inputClass}
                    />
                    <InlineHelp field="hotWarm" />
                  </div>
                  <div className={`relative ${activeField === 'rawRatio' ? 'z-40' : 'z-10'}`}>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Raw Ratio (%)</label>
                    <input 
                      type="number" 
                      value={rawStoragePercent}
                      onChange={(e) => setRawStoragePercent(Number(e.target.value))}
                      onFocus={() => setActiveField('rawRatio')}
                      onBlur={() => setActiveField(null)}
                      className={inputClass}
                    />
                    <InlineHelp field="rawRatio" />
                  </div>
                  <div className={`relative ${activeField === 'metaRatio' ? 'z-40' : 'z-10'}`}>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Metadata Ratio (%)</label>
                    <input 
                      type="number" 
                      value={metaStoragePercent}
                      onChange={(e) => setMetaStoragePercent(Number(e.target.value))}
                      onFocus={() => setActiveField('metaRatio')}
                      onBlur={() => setActiveField(null)}
                      className={inputClass}
                    />
                    <InlineHelp field="metaRatio" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={exportToPNG}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium transition-colors shadow-sm rounded-lg"
              >
                <Camera className="w-4 h-4" />
                <span>Export PNG Report</span>
              </button>
              <button 
                onClick={exportToCSV}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-sm font-medium transition-colors shadow-sm rounded-lg"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV Report</span>
              </button>
            </div>

            {/* --- PNG EXPORT TARGET WRAPPER --- */}
            <div ref={exportRef} className="space-y-6 p-4 -m-4 bg-slate-50 rounded-xl">
            
              {/* Top Level Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Metric Card 1 */}
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

                {/* Metric Card 2 */}
                <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 p-6 shadow-sm text-white border border-fuchsia-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-fuchsia-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-fuchsia-100">Daily Physical Storage</h3>
                    <Database className="w-5 h-5 text-fuchsia-200" />
                  </div>
                  <div className="text-4xl font-bold tracking-tight mb-1">
                    {dailyStorageTotalMb.toFixed(1)} <span className="text-xl text-fuchsia-200 font-medium">MB</span>
                  </div>
                  <div className="text-sm text-fuchsia-100">Incl. RF({replicationFactor}) and SF({searchFactor})</div>
                </div>

                {/* Metric Card 3 */}
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

                {/* Metric Card 4 */}
                <div className="bg-gradient-to-br from-teal-400 to-emerald-600 p-6 shadow-sm text-white border border-emerald-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-emerald-100">Monthly Storage</h3>
                    <Database className="w-5 h-5 text-emerald-200" />
                  </div>
                  <div className="text-4xl font-bold tracking-tight mb-1">
                    {monthlyStorageTotalGb.toFixed(2)} <span className="text-xl text-emerald-200 font-medium">GB</span>
                  </div>
                  <div className="text-sm text-emerald-100">30-day physical projection</div>
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
                <div className="h-3 w-full bg-indigo-950/50 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 shadow-sm ${
                      monthlyUtilizationPercent > 100 ? 'bg-red-500' : monthlyUtilizationPercent > 80 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`} 
                    style={{ width: `${Math.min(monthlyUtilizationPercent, 100)}%` }}
                  />
                </div>
                {monthlyUtilizationPercent > 100 && (
                  <p className="text-xs text-red-300 mt-3 flex items-center gap-1 font-medium bg-red-900/30 p-2">
                    <AlertTriangle className="w-4 h-4" /> This data source exceeds your entire monthly license quota!
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
                      <span className="font-medium text-slate-700">1. Events Captured</span>
                      <span className="font-bold text-slate-900">{eventsPerDay.toLocaleString(undefined, {maximumFractionDigits: 0})} events/day</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {events.toLocaleString()} events captured {intervalsPerDay.toFixed(0)} times per day (every {intervalMinutes} min).
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">2. Base Raw Data Volume</span>
                      <span className="font-bold text-slate-900">{dailyRawKbBase.toLocaleString(undefined, {maximumFractionDigits: 0})} KB</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {payloadSizeKb} KB per poll × {intervalsPerDay.toFixed(0)} intervals {peakMultiplier > 1 ? `× ${peakMultiplier} peak buffer` : ''}.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">3. Daily License Volume</span>
                      <span className="font-bold text-slate-900 text-blue-600">{licenseVolumeMb.toFixed(1)} MB</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Converted from KB to MB, including {overheadPercent}% sizing buffer/overhead.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex justify-between text-sm mb-3">
                      <span className="font-medium text-slate-700">4. Physical Storage Required</span>
                      <span className="font-bold text-slate-900">{dailyStorageTotalMb.toFixed(1)} MB / day</span>
                    </div>
                    
                    {/* Storage Visual Bar */}
                    <div className="h-4 w-full bg-slate-100 flex overflow-hidden mb-2">
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
                        <span className="w-2 h-2 bg-emerald-500 mr-2"></span>
                        Compressed Raw ({rawStoragePercent}% × RF:{replicationFactor}): {storageRawMb.toFixed(1)} MB
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-indigo-500 mr-2"></span>
                        Metadata ({metaStoragePercent}% × SF:{searchFactor}): {storageMetaMb.toFixed(1)} MB
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Storage Tiering Forecast */}
              <div className="bg-white shadow-sm border border-slate-200 flex flex-col transition-all duration-300 hover:shadow-md">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="font-semibold text-slate-800 flex items-center mb-1">
                      <HardDrive className="w-5 h-5 mr-2 text-slate-500" />
                      Tiered Storage Requirements
                    </h3>
                    <p className="text-sm text-slate-500">Physical disk required for {retentionDays} total days of retention.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900">
                      {totalRetentionGb.toFixed(2)} <span className="text-lg text-slate-500">GB</span>
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Total Physical Disk</div>
                  </div>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center p-4 bg-orange-50 border border-orange-100 rounded-lg">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-full mr-4">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm text-orange-600 font-semibold mb-1">Hot / Warm Tier ({actualHotWarmDays} Days)</div>
                      <div className="text-2xl font-bold text-slate-800">{hotWarmRetentionGb.toFixed(2)} GB</div>
                      <div className="text-xs text-slate-500 mt-1">High-IOPS Storage (NVMe/SSD)</div>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-sky-50 border border-sky-100 rounded-lg">
                    <div className="p-3 bg-sky-100 text-sky-600 rounded-full mr-4">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm text-sky-600 font-semibold mb-1">Cold Tier ({Math.max(0, retentionDays - hotWarmDays)} Days)</div>
                      <div className="text-2xl font-bold text-slate-800">{coldRetentionGb.toFixed(2)} GB</div>
                      <div className="text-xs text-slate-500 mt-1">Standard Storage (HDD/S3)</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            {/* --- END PNG EXPORT TARGET WRAPPER --- */}

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
          <div className="mt-6 p-4 bg-slate-100 text-xs text-slate-500 border-l-4 border-slate-300">
            <strong>Disclaimer:</strong> This tool provides baseline architectural estimates. Actual Splunk consumption varies based on the specific cardinality of your data, the exact structure of JSON payloads, and enterprise architecture settings (such as Indexer Clustering Replication Factor, which acts as a direct multiplier on required disk storage).
          </div>
        </div>

      </div>
    </div>
  );
}
