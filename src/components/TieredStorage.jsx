import { HardDrive, Layers, Database } from 'lucide-react';

export default function TieredStorage({ metrics, retentionDays }) {
  const coldDays = Math.max(0, retentionDays - metrics.actualHotWarmDays);

  return (
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
            <div className="text-xs text-accenture-gray-dark font-medium uppercase tracking-[0.12em] mb-1">Cold tier · {coldDays} days</div>
            <div className="text-2xl font-semibold tracking-tight text-black">{metrics.coldRetentionGb.toFixed(2)} GB</div>
            <div className="text-xs text-accenture-gray-dark mt-1">Standard storage (HDD/S3)</div>
          </div>
        </div>
      </div>
    </section>
  );
}
