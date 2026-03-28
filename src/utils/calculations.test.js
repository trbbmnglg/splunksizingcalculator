import { describe, it, expect } from 'vitest';
import { computeSizing } from './calculations';

const defaults = {
  events: 1000,
  intervalMinutes: 5,
  payloadSizeKb: 183,
  ingestionMethod: 'api',
  rawStoragePercent: 15,
  metaStoragePercent: 35,
  retentionDays: 30,
  monthlyLicenseQuotaGb: 300,
  replicationFactor: 1,
  searchFactor: 1,
  hotWarmDays: 7,
  peakMultiplier: 1.0,
};

describe('computeSizing', () => {
  it('computes correct intervals per day', () => {
    const result = computeSizing(defaults);
    expect(result.intervalsPerDay).toBe(288);
  });

  it('computes correct events per day', () => {
    const result = computeSizing(defaults);
    expect(result.eventsPerDay).toBe(288000);
  });

  it('applies API overhead (25%)', () => {
    const result = computeSizing(defaults);
    expect(result.overheadPercent).toBe(25.0);
    expect(result.licenseVolumeMb).toBeCloseTo(result.dailyRawMbBase * 1.25, 4);
  });

  it('applies UF overhead (12.11%)', () => {
    const result = computeSizing({ ...defaults, ingestionMethod: 'uf' });
    expect(result.overheadPercent).toBe(12.11);
    expect(result.licenseVolumeMb).toBeCloseTo(result.dailyRawMbBase * 1.1211, 4);
  });

  it('handles zero interval by clamping to 1', () => {
    const result = computeSizing({ ...defaults, intervalMinutes: 0 });
    expect(result.intervalsPerDay).toBe(1440);
    expect(Number.isFinite(result.licenseVolumeMb)).toBe(true);
  });

  it('handles zero events gracefully', () => {
    const result = computeSizing({ ...defaults, events: 0 });
    expect(result.eventsPerDay).toBe(0);
    expect(result.licenseVolumeMb).toBeGreaterThan(0); // payload still contributes
  });

  it('multiplies raw storage by RF', () => {
    const rf1 = computeSizing({ ...defaults, replicationFactor: 1 });
    const rf3 = computeSizing({ ...defaults, replicationFactor: 3 });
    expect(rf3.storageRawMb).toBeCloseTo(rf1.storageRawMb * 3, 4);
  });

  it('multiplies meta storage by SF', () => {
    const sf1 = computeSizing({ ...defaults, searchFactor: 1 });
    const sf2 = computeSizing({ ...defaults, searchFactor: 2 });
    expect(sf2.storageMetaMb).toBeCloseTo(sf1.storageMetaMb * 2, 4);
  });

  it('caps hot/warm days at retention days', () => {
    const result = computeSizing({ ...defaults, retentionDays: 10, hotWarmDays: 30 });
    expect(result.actualHotWarmDays).toBe(10);
    expect(result.coldRetentionGb).toBe(0);
  });

  it('returns 0% utilization when quota is 0', () => {
    const result = computeSizing({ ...defaults, monthlyLicenseQuotaGb: 0 });
    expect(result.monthlyUtilizationPercent).toBe(0);
  });

  it('applies peak multiplier correctly', () => {
    const base = computeSizing({ ...defaults, peakMultiplier: 1.0 });
    const peak = computeSizing({ ...defaults, peakMultiplier: 1.5 });
    expect(peak.dailyRawKbBase).toBeCloseTo(base.dailyRawKbBase * 1.5, 4);
  });

  it('bar percentages are 0 when storage is 0', () => {
    const result = computeSizing({ ...defaults, payloadSizeKb: 0, rawStoragePercent: 0, metaStoragePercent: 0 });
    expect(result.rawBarPercent).toBe(0);
    expect(result.metaBarPercent).toBe(0);
  });

  it('monthly projection is 30x daily', () => {
    const result = computeSizing(defaults);
    expect(result.monthlyLicenseVolumeGb).toBeCloseTo(result.licenseVolumeGb * 30, 6);
    expect(result.monthlyStorageTotalGb).toBeCloseTo(result.dailyStorageTotalGb * 30, 6);
  });
});
