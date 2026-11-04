// Provider search results vary. Only use explicit duration and publication data.
export function durationSeconds(video) {
  const raw = video?.contentDetails?.duration || video?.lengthText?.simpleText || video?.lengthText || video?.duration;
  if (typeof raw !== 'string') return null;
  const iso = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(raw);
  let seconds;
  if (iso && iso.slice(1).some(Boolean)) {
    seconds = Number(iso[1] || 0) * 3600 + Number(iso[2] || 0) * 60 + Number(iso[3] || 0);
  } else if (/^(?:\d+:)?\d{1,2}:\d{2}$/.test(raw)) {
    const parts = raw.split(':').map(Number);
    if (parts.at(-1) >= 60 || (parts.length === 3 && parts[1] >= 60)) return null;
    seconds = parts.reduce((total, part) => total * 60 + part, 0);
  }
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : null;
}

export function durationLabel(video) {
  const seconds = durationSeconds(video);
  if (!seconds) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const rest = String(seconds % 60).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

export function publishedLabel(video) {
  const value = video?.snippet?.publishedAt;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en', {month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'}).format(date)
    : null;
}
