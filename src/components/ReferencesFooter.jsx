import { ExternalLink } from 'lucide-react';

export default function ReferencesFooter() {
  return (
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
  );
}
