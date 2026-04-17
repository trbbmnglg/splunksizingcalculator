import { Clock } from 'lucide-react';

export default function CalculationBreakdown({
  metrics, events, intervalMinutes, payloadSizeKb, peakMultiplier,
  rawStoragePercent, metaStoragePercent, replicationFactor, searchFactor,
}) {
  return (
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
  );
}
