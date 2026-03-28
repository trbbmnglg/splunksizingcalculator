export function parseFileEvents(content) {
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed.length : 1;
  } catch {
    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    return lines.length > 0 ? lines.length : 1;
  }
}
