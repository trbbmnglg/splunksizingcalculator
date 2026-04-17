import { Activity, Upload, FileCheck } from 'lucide-react';
import NumberInput from './NumberInput';
import { INGESTION_METHODS } from '../utils/constants';

export default function DataSourceSection({
  ingestionMethod, setIngestionMethod,
  events, handleEventsChange,
  intervalMinutes, setIntervalMinutes,
  payloadSizeKb,
  uploadedFileName, handleFileUpload, fileInputRef,
  activeField, focusField, blurField, numChange,
}) {
  const intervalWarning = intervalMinutes <= 0;

  return (
    <section className="bg-white p-6 border border-accenture-gray-light">
      <h2 className="text-lg font-semibold tracking-tight mb-5 flex items-center text-black">
        <Activity className="w-5 h-5 mr-2 text-accenture-purple" aria-hidden="true" />
        Data source parameters
      </h2>
      <div className="space-y-4">

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
  );
}
