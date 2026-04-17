import { useState, useMemo, useCallback, useRef } from 'react';
import { computeSizing } from '../utils/calculations';
import { parseFileEvents } from '../utils/fileParser';
import {
  DEFAULT_KB_PER_1K_EVENTS,
  MAX_UPLOAD_BYTES,
  INGESTION_METHODS,
} from '../utils/constants';

/**
 * Consolidates every input field, derived metric, and event handler for the
 * Splunk sizing calculator. Extracted from App.jsx so the page component
 * stays under the 300-line limit and the input logic is independently
 * testable.
 * @param {(t: { type: string, message: string }) => void} toast - Toast pusher (from useToast)
 * @returns {Object} State values, setters, handlers, and the memoized `metrics`
 */
export function useSizingInputs(toast) {
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

  const fileInputRef = useRef(null);

  const metrics = useMemo(
    () =>
      computeSizing({
        events, intervalMinutes, payloadSizeKb, ingestionMethod,
        rawStoragePercent, metaStoragePercent, retentionDays,
        monthlyLicenseQuotaGb, replicationFactor, searchFactor,
        hotWarmDays, peakMultiplier,
      }),
    [
      events, intervalMinutes, payloadSizeKb, ingestionMethod,
      rawStoragePercent, metaStoragePercent, retentionDays,
      monthlyLicenseQuotaGb, replicationFactor, searchFactor,
      hotWarmDays, peakMultiplier,
    ],
  );

  const handleEventsChange = useCallback((e) => {
    const newEvents = Math.max(0, Number(e.target.value) || 0);
    if (events > 0 && newEvents > 0) {
      setPayloadSizeKb(+(payloadSizeKb * (newEvents / events)).toFixed(2));
    } else if (events === 0 && newEvents > 0) {
      setPayloadSizeKb((newEvents / 1000) * DEFAULT_KB_PER_1K_EVENTS);
    } else if (newEvents === 0) {
      // Keep payload aligned with events — otherwise "0 events captured"
      // shows alongside a non-zero license (payload stays at its old value).
      setPayloadSizeKb(0);
    }
    setEvents(newEvents);
  }, [events, payloadSizeKb]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        type: 'error',
        message: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Please upload a sample under 50 MB.`,
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (readEvent) => {
      const estimatedEvents = parseFileEvents(readEvent.target.result);
      setPayloadSizeKb(+(file.size / 1024).toFixed(2));
      setEvents(estimatedEvents);
      setUploadedFileName(file.name);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({
        type: 'success',
        message: `Loaded ${file.name} — ${estimatedEvents.toLocaleString()} events, ${(file.size / 1024).toFixed(1)} KB.`,
      });
    };
    reader.readAsText(file);
  }, [toast]);

  const focusField = useCallback((field) => setActiveField(field), []);
  const blurField = useCallback(() => setActiveField(null), []);
  const numChange = useCallback((setter) => (e) => setter(Math.max(0, Number(e.target.value) || 0)), []);

  // Clamp advisory-only HTML attrs into state so a pasted out-of-range
  // value (peak<1, hotWarm>retention) can't silently diverge from the UI.
  const handlePeakMultiplierChange = useCallback((e) => {
    const v = Number(e.target.value);
    setPeakMultiplier(Math.max(1, Number.isFinite(v) && v > 0 ? v : 1));
  }, []);
  const handleHotWarmChange = useCallback((e) => {
    const v = Math.max(0, Number(e.target.value) || 0);
    setHotWarmDays(Math.min(retentionDays, v));
  }, [retentionDays]);

  return {
    // state
    activeField, events, intervalMinutes, payloadSizeKb, ingestionMethod,
    rawStoragePercent, metaStoragePercent, retentionDays, monthlyLicenseQuotaGb,
    replicationFactor, searchFactor, hotWarmDays, peakMultiplier, uploadedFileName,
    // setters
    setIngestionMethod, setIntervalMinutes, setRawStoragePercent,
    setMetaStoragePercent, setRetentionDays, setMonthlyLicenseQuotaGb,
    setReplicationFactor, setSearchFactor,
    // handlers
    handleEventsChange, handleFileUpload,
    handlePeakMultiplierChange, handleHotWarmChange,
    focusField, blurField, numChange,
    // refs + derived
    fileInputRef, metrics,
  };
}
