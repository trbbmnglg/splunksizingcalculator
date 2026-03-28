import { MINUTES_PER_DAY, INGESTION_BUFFER, INGESTION_METHODS } from './constants';

export function computeSizing({
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
}) {
  const overheadPercent = INGESTION_BUFFER[ingestionMethod] ?? INGESTION_BUFFER[INGESTION_METHODS.API];
  const safeInterval = Math.max(1, intervalMinutes);
  const safeEvents = Math.max(0, events);

  const intervalsPerDay = MINUTES_PER_DAY / safeInterval;
  const eventsPerDay = safeEvents * intervalsPerDay;

  const dailyRawKbBase = payloadSizeKb * intervalsPerDay * peakMultiplier;
  const dailyRawMbBase = dailyRawKbBase / 1024;

  // License = raw event data only (what Splunk actually meters)
  const licenseVolumeMb = dailyRawMbBase;
  const licenseVolumeGb = licenseVolumeMb / 1024;

  // Storage = apply planning buffer for data expansion, then compression/index ratios
  const plannedVolumeMb = dailyRawMbBase * (1 + overheadPercent / 100);
  const storageRawMb = plannedVolumeMb * (rawStoragePercent / 100) * replicationFactor;
  const storageMetaMb = plannedVolumeMb * (metaStoragePercent / 100) * searchFactor;
  const dailyStorageTotalMb = storageRawMb + storageMetaMb;
  const dailyStorageTotalGb = dailyStorageTotalMb / 1024;

  const monthlyLicenseVolumeGb = licenseVolumeGb * 30;
  const monthlyStorageTotalGb = dailyStorageTotalGb * 30;
  const monthlyUtilizationPercent =
    monthlyLicenseQuotaGb > 0 ? (monthlyLicenseVolumeGb / monthlyLicenseQuotaGb) * 100 : 0;

  const totalRetentionGb = dailyStorageTotalGb * retentionDays;
  const actualHotWarmDays = Math.min(retentionDays, hotWarmDays);
  const hotWarmRetentionGb = dailyStorageTotalGb * actualHotWarmDays;
  const coldRetentionGb = Math.max(0, totalRetentionGb - hotWarmRetentionGb);

  const rawBarPercent = dailyStorageTotalMb > 0 ? (storageRawMb / dailyStorageTotalMb) * 100 : 0;
  const metaBarPercent = dailyStorageTotalMb > 0 ? (storageMetaMb / dailyStorageTotalMb) * 100 : 0;

  return {
    overheadPercent,
    intervalsPerDay,
    eventsPerDay,
    dailyRawKbBase,
    dailyRawMbBase,
    licenseVolumeMb,
    licenseVolumeGb,
    plannedVolumeMb,
    storageRawMb,
    storageMetaMb,
    dailyStorageTotalMb,
    dailyStorageTotalGb,
    monthlyLicenseVolumeGb,
    monthlyStorageTotalGb,
    monthlyUtilizationPercent,
    totalRetentionGb,
    actualHotWarmDays,
    hotWarmRetentionGb,
    coldRetentionGb,
    rawBarPercent,
    metaBarPercent,
  };
}
