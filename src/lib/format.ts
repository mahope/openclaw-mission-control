export function formatRelativeTime(ts: number, now = Date.now()) {
  const deltaMs = ts - now;
  const abs = Math.abs(deltaMs);
  const suffix = deltaMs < 0 ? "siden" : "om";

  const minutes = Math.round(abs / 60000);
  if (minutes < 1) return deltaMs < 0 ? "lige nu" : "nu";
  if (minutes < 60) return `${minutes} min ${suffix}`;

  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} t ${suffix}`;

  const days = Math.round(hours / 24);
  return `${days} dage ${suffix}`;
}
