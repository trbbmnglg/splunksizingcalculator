let loadPromise = null;

function loadHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.integrity = 'sha512-s/XK4vYVX0ieiZxt4ezGCLlSiiTfIBUZp1vr6k1sHQhTOC/MYni/YTud9mmZ8iaQqnTVMXLfW0I7suKCYfCzw==';
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load html2canvas'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export async function exportToPNG(element) {
  await loadHtml2Canvas();

  const canvas = await window.html2canvas(element, {
    backgroundColor: '#f8fafc',
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
