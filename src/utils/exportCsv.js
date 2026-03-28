function escapeCsvValue(value) {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(...cells) {
  return cells.map(escapeCsvValue).join(',');
}

export function exportToCSV(inputs, metrics) {
  const rows = [
    'Splunk Sizing Estimate Report',
    '',
    csvRow('Metric', 'Value'),
    csvRow('Number of Events (per poll)', inputs.events),
    csvRow('Polling Interval (min)', inputs.intervalMinutes),
    csvRow('Payload Size (KB)', inputs.payloadSizeKb),
    csvRow('Peak Volume Buffer Multiplier', `${inputs.peakMultiplier}x`),
    csvRow('Replication Factor (RF)', inputs.replicationFactor),
    csvRow('Search Factor (SF)', inputs.searchFactor),
    csvRow('Daily License Volume (MB)', metrics.licenseVolumeMb.toFixed(2)),
    csvRow('Daily Planned Volume incl. Buffer (MB)', metrics.plannedVolumeMb.toFixed(2)),
    csvRow('Daily Physical Storage (MB)', metrics.dailyStorageTotalMb.toFixed(2)),
    csvRow('Monthly License Volume (GB)', metrics.monthlyLicenseVolumeGb.toFixed(2)),
    csvRow('Monthly Physical Storage (GB)', metrics.monthlyStorageTotalGb.toFixed(2)),
    csvRow(`Total Disk Needed (${inputs.retentionDays} Days) (GB)`, metrics.totalRetentionGb.toFixed(2)),
    csvRow('Hot/Warm Disk Needed (GB)', metrics.hotWarmRetentionGb.toFixed(2)),
    csvRow('Cold Disk Needed (GB)', metrics.coldRetentionGb.toFixed(2)),
  ];

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'splunk_sizing_report.csv';
  link.click();
  URL.revokeObjectURL(url);
}
