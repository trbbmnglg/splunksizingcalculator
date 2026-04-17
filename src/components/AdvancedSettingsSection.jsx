import { Settings, Activity, Cpu, Layers } from 'lucide-react';
import NumberInput from './NumberInput';

export default function AdvancedSettingsSection({
  monthlyLicenseQuotaGb, setMonthlyLicenseQuotaGb,
  peakMultiplier, handlePeakMultiplierChange,
  replicationFactor, setReplicationFactor,
  searchFactor, setSearchFactor,
  retentionDays, setRetentionDays,
  hotWarmDays, handleHotWarmChange,
  rawStoragePercent, setRawStoragePercent,
  metaStoragePercent, setMetaStoragePercent,
  activeField, focusField, blurField, numChange,
}) {
  return (
    <section className="bg-white p-6 border border-accenture-gray-light">
      <h2 className="text-lg font-semibold tracking-tight mb-5 flex items-center text-black">
        <Settings className="w-5 h-5 mr-2 text-accenture-purple" aria-hidden="true" />
        Advanced settings
      </h2>

      <div className="space-y-4 mb-6 pb-6 border-b border-accenture-gray-light">
        <h3 className="text-xs font-medium text-accenture-purple uppercase tracking-[0.14em] mb-2 flex items-center">
          <Activity className="w-3.5 h-3.5 mr-2" aria-hidden="true" /> General constraints
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="Monthly quota (GB)" field="quota" value={monthlyLicenseQuotaGb} onChange={numChange(setMonthlyLicenseQuotaGb)} activeField={activeField} onFocus={focusField} onBlur={blurField} />
          <NumberInput label="Peak buffer (multi.)" field="peakBuffer" value={peakMultiplier} onChange={handlePeakMultiplierChange} activeField={activeField} onFocus={focusField} onBlur={blurField} step="0.1" min={1.0} />
        </div>
      </div>

      <div className="space-y-4 mb-6 pb-6 border-b border-accenture-gray-light">
        <h3 className="text-xs font-medium text-accenture-purple uppercase tracking-[0.14em] mb-2 flex items-center">
          <Cpu className="w-3.5 h-3.5 mr-2" aria-hidden="true" /> Enterprise clustering
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="Replication factor (RF)" field="rf" value={replicationFactor} onChange={numChange(setReplicationFactor)} activeField={activeField} onFocus={focusField} onBlur={blurField} min={1} max={10} />
          <NumberInput label="Search factor (SF)" field="sf" value={searchFactor} onChange={numChange(setSearchFactor)} activeField={activeField} onFocus={focusField} onBlur={blurField} min={1} max={10} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-medium text-accenture-purple uppercase tracking-[0.14em] mb-2 flex items-center">
          <Layers className="w-3.5 h-3.5 mr-2" aria-hidden="true" /> Storage &amp; tiering
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="Total retention (days)" field="retention" value={retentionDays} onChange={numChange(setRetentionDays)} activeField={activeField} onFocus={focusField} onBlur={blurField} />
          <NumberInput label="Hot/warm (days)" field="hotWarm" value={hotWarmDays} onChange={handleHotWarmChange} activeField={activeField} onFocus={focusField} onBlur={blurField} max={retentionDays} />
          <NumberInput label="Raw ratio (%)" field="rawRatio" value={rawStoragePercent} onChange={numChange(setRawStoragePercent)} activeField={activeField} onFocus={focusField} onBlur={blurField} />
          <NumberInput label="Metadata ratio (%)" field="metaRatio" value={metaStoragePercent} onChange={numChange(setMetaStoragePercent)} activeField={activeField} onFocus={focusField} onBlur={blurField} />
        </div>
      </div>
    </section>
  );
}
