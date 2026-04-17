import { useRef, useState, useCallback } from 'react';
import { Calculator, Server, Database, Download, Camera } from 'lucide-react';

import MetricCard from './components/MetricCard';
import ExportButton from './components/ExportButton';
import ErrorBoundary from './components/ErrorBoundary';
import DataSourceSection from './components/DataSourceSection';
import AdvancedSettingsSection from './components/AdvancedSettingsSection';
import UtilizationCard from './components/UtilizationCard';
import CalculationBreakdown from './components/CalculationBreakdown';
import TieredStorage from './components/TieredStorage';
import ReferencesFooter from './components/ReferencesFooter';
import { useToast } from './components/Toast';
import { useSizingInputs } from './hooks/useSizingInputs';
import { exportToCSV } from './utils/exportCsv';
import { exportToPNG } from './utils/exportPng';

export default function App() {
  const { push: toast, ToastContainer } = useToast();
  const inputs = useSizingInputs(toast);
  const {
    metrics,
    events, intervalMinutes, payloadSizeKb, peakMultiplier,
    rawStoragePercent, metaStoragePercent,
    replicationFactor, searchFactor,
    retentionDays, hotWarmDays, monthlyLicenseQuotaGb,
  } = inputs;

  const exportRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handleCSV = useCallback(() => {
    try {
      exportToCSV(
        { events, intervalMinutes, payloadSizeKb, peakMultiplier, replicationFactor, searchFactor, retentionDays },
        metrics,
      );
      toast({ type: 'success', message: 'CSV report downloaded.' });
    } catch (err) {
      console.error('Failed to export CSV:', err);
      toast({ type: 'error', message: 'Failed to export CSV. Please try again.' });
    }
  }, [events, intervalMinutes, payloadSizeKb, peakMultiplier, replicationFactor, searchFactor, retentionDays, metrics, toast]);

  const handlePNG = useCallback(async () => {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    try {
      await exportToPNG(exportRef.current);
      toast({ type: 'success', message: 'PNG report downloaded.' });
    } catch (err) {
      console.error('Failed to export PNG:', err);
      toast({ type: 'error', message: 'Failed to export image. Please try again.' });
    } finally {
      setExporting(false);
    }
  }, [exporting, toast]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-accenture-gray-off-white text-black p-4 md:p-10">
        <div className="max-w-6xl mx-auto space-y-8">

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

            <div className="lg:col-span-5 space-y-6">
              <DataSourceSection {...inputs} />
              <AdvancedSettingsSection {...inputs} />
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="flex justify-end gap-3">
                <ExportButton onClick={handlePNG} icon={Camera} label={exporting ? 'Exporting…' : 'Export PNG report'} disabled={exporting} variant="primary" />
                <ExportButton onClick={handleCSV} icon={Download} label="Export CSV report" variant="secondary" />
              </div>

              <div ref={exportRef} className="space-y-6 p-4 -m-4 bg-accenture-gray-off-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MetricCard title="Daily license volume" value={metrics.licenseVolumeMb.toFixed(1)} unit="MB" subtitle={`${metrics.licenseVolumeGb.toFixed(4)} GB / day`} icon={Server} colorScheme="purple" />
                  <MetricCard title="Daily physical storage" value={metrics.dailyStorageTotalMb.toFixed(1)} unit="MB" subtitle={`Incl. RF(${replicationFactor}) and SF(${searchFactor})`} icon={Database} colorScheme="purple-dark" />
                  <MetricCard title="Monthly license" value={metrics.monthlyLicenseVolumeGb.toFixed(2)} unit="GB" subtitle="30-day projected volume" icon={Server} colorScheme="purple-darkest" />
                  <MetricCard title="Monthly storage" value={metrics.monthlyStorageTotalGb.toFixed(2)} unit="GB" subtitle="30-day physical projection" icon={Database} colorScheme="black" />
                </div>

                <UtilizationCard metrics={metrics} monthlyLicenseQuotaGb={monthlyLicenseQuotaGb} />

                <CalculationBreakdown
                  metrics={metrics}
                  events={events}
                  intervalMinutes={intervalMinutes}
                  payloadSizeKb={payloadSizeKb}
                  peakMultiplier={peakMultiplier}
                  rawStoragePercent={rawStoragePercent}
                  metaStoragePercent={metaStoragePercent}
                  replicationFactor={replicationFactor}
                  searchFactor={searchFactor}
                />

                <TieredStorage metrics={metrics} retentionDays={retentionDays} />
              </div>
            </div>
          </div>

          <ReferencesFooter />
        </div>
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
