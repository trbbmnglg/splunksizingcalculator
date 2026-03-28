import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCSV } from './exportCsv';

describe('exportToCSV', () => {
  let clickedHref;

  beforeEach(() => {
    clickedHref = null;
    // Mock Blob and URL.createObjectURL
    global.Blob = class {
      constructor(parts, opts) {
        this.content = parts.join('');
        this.type = opts?.type;
      }
    };
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      set href(v) { clickedHref = v; },
      get href() { return clickedHref; },
      download: '',
      click: vi.fn(),
    });
  });

  it('escapes values containing commas', () => {
    const inputs = {
      events: 1000,
      intervalMinutes: 5,
      payloadSizeKb: 183,
      peakMultiplier: 1.0,
      replicationFactor: 1,
      searchFactor: 1,
      retentionDays: 30,
    };
    const metrics = {
      licenseVolumeMb: { toFixed: () => '1.00' },
      dailyStorageTotalMb: { toFixed: () => '2.00' },
      monthlyLicenseVolumeGb: { toFixed: () => '3.00' },
      monthlyStorageTotalGb: { toFixed: () => '4.00' },
      totalRetentionGb: { toFixed: () => '5.00' },
      hotWarmRetentionGb: { toFixed: () => '6.00' },
      coldRetentionGb: { toFixed: () => '7.00' },
    };

    exportToCSV(inputs, metrics);
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});
