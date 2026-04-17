// Dynamic import keeps html2canvas (~230 KB gzipped) out of the initial bundle
// — it loads on first PNG export click. Replaces a prior CDN script-tag loader
// so the app ships self-contained (no external script-src, no stale pin).
export async function exportToPNG(element) {
  const mod = await import('html2canvas');
  const html2canvas = mod.default || mod;

  const canvas = await html2canvas(element, {
    // Accenture gray-off-white — matches the in-app panel backdrop so the
    // exported image doesn't show a foreign slate/white edge.
    backgroundColor: '#F1F1EF',
    scale: 2,
    logging: false,
    useCORS: true,
  });

  const image = canvas.toDataURL('image/png', 1.0);
  const link = document.createElement('a');
  link.download = 'splunk_sizing_visual_report.png';
  link.href = image;
  link.click();
}
