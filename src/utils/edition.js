import { videoId } from './library';
import { durationSeconds } from './video-metadata';

export const editionLanes = [
  { id: 'world', name: 'Places & landscapes', topic: 'Landscapes', query: 'landscapes geography nature documentary', reason: 'A wider view of the places and forces that shape our world.' },
  { id: 'tech', name: 'AI & technology', topic: 'AI', query: 'AI technology latest developments explained', reason: 'An idea or development to examine beyond the headline.' },
  { id: 'culture', name: 'Culture & food', topic: 'Culture & Food', query: 'food culture traditions documentary', reason: 'A different way of seeing how people live, cook and connect.' },
];

// Keep lane coverage before adding a fourth pick. Prefer 3–10 minute pieces
// when available, without inventing a duration for unlabelled search results.
export function selectEdition(lanes, offset = 0) {
  const prepared = lanes.map(lane => {
    const eligible = (lane.items || []).filter(video => videoId(video));
    const shorter = eligible.filter(video => {
      const seconds = durationSeconds(video);
      return seconds !== null && seconds >= 180 && seconds <= 600;
    });
    const pool = shorter.length ? shorter : eligible;
    const start = pool.length ? ((offset % pool.length) + pool.length) % pool.length : 0;
    return {...lane, items: [...pool.slice(start), ...pool.slice(0, start)]};
  });
  const selected = [];
  const seen = new Set();
  function take(lane, respectBudget = false) {
    const known = selected.map(pick => durationSeconds(pick.video));
    const total = known.reduce((sum, seconds) => sum + (seconds || 0), 0);
    const video = lane.items.find(item => !seen.has(videoId(item)) &&
      (!respectBudget || known.some(seconds => seconds === null) || durationSeconds(item) === null || total + durationSeconds(item) <= 1800));
    if (!video) return;
    seen.add(videoId(video));
    selected.push({video, lane});
  }
  prepared.forEach(lane => take(lane));
  for (const lane of prepared) {
    if (selected.length >= 4) break;
    take(lane, true);
  }
  return selected;
}
