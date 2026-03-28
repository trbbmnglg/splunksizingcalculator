export const DEFAULT_KB_PER_1K_EVENTS = 183;
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
export const MINUTES_PER_DAY = 1440;

export const INGESTION_METHODS = {
  API: 'api',
  UF: 'uf',
};

export const INGESTION_OVERHEAD = {
  [INGESTION_METHODS.API]: 25.0,
  [INGESTION_METHODS.UF]: 12.11,
};

export const FIELD_DESCRIPTIONS = {
  events: { title: "Number of Events", desc: "The total volume of individual log lines, records, or jobs generated in a single polling cycle." },
  interval: { title: "Polling Interval", desc: "How frequently (in minutes) the data source generates this batch of events. (e.g., 5 means every 5 minutes)." },
  payloadSize: { title: "Payload Size", desc: "The physical file size of the events. Uploading a sample file will measure and calculate this perfectly for you." },
  quota: { title: "Monthly Quota", desc: "Your organization's maximum allowable Splunk ingest limit per month (used to calculate % utilization)." },
  peakBuffer: { title: "Peak Buffer", desc: "A safety multiplier for business hours. E.g., 1.2 adds 20% extra padding to account for peak traffic spikes." },
  rf: { title: "Replication Factor (RF)", desc: "Enterprise clustering setting. Defines how many identical copies of raw data are stored across your indexers for disaster recovery. Standard is 2 or 3." },
  sf: { title: "Search Factor (SF)", desc: "Enterprise clustering setting. Defines how many copies of index metadata are kept to ensure searches remain fast if a server goes down. Standard is 2." },
  retention: { title: "Total Retention", desc: "The maximum number of days this data will be stored and searchable in Splunk before it is permanently deleted." },
  hotWarm: { title: "Hot/Warm Retention", desc: "The number of days data lives on fast, expensive NVMe/SSD storage before rolling to cheaper Cold (HDD/S3) storage." },
  rawRatio: { title: "Raw Ratio", desc: "Splunk compresses raw text. 15% means 100GB of text shrinks to ~15GB on disk. Highly repetitive data compresses better." },
  metaRatio: { title: "Metadata Ratio", desc: "Splunk builds index files (tsidx) to make searches fast. This typically takes up 35% of the original file size." },
};
