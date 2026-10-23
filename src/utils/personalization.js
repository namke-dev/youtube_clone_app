import { topics as catalog } from './topics';

export const MAX_TOPIC_LENGTH = 80;
const CACHE_WINDOW = 30 * 60 * 1000;
const normalizeName = value => value.normalize('NFC').replace(/\p{Cc}/gu, ' ').trim().replace(/\s+/g, ' ');
export function cleanFavorites(values, topics = catalog) {
  if (!Array.isArray(values)) return [];
  const known = new Map(topics.slice(1).map(topic => [topic.name.toLowerCase(), topic.name]));
  const seen = new Set([topics[0].name.toLowerCase()]);
  const names = [];
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const name = normalizeName(value);
    const key = name.toLowerCase();
    if (!name || name.length > MAX_TOPIC_LENGTH || seen.has(key)) continue;
    seen.add(key);
    names.push(known.get(key) || name);
  }
  return names;
}
export function topicFromName(name, topics = catalog) {
  const normalized = typeof name === 'string' ? normalizeName(name) : '';
  const known = topics.find(topic => topic.name.toLowerCase() === normalized.toLowerCase());
  if (known) return known;
  return {name: normalized, query: normalized};
}
export function favoriteTopicBar(favorites, topics = catalog, current) {
  const names = cleanFavorites(favorites, topics);
  if (!names.length) return topics;
  const visible = cleanFavorites([...names, current], topics);
  return [topics[0], ...visible.map(name => topicFromName(name, topics))];
}
export function forYouQuery(favorites, topics = catalog, now = Date.now()) {
  const names = cleanFavorites(favorites, topics).map(name => name.replace(/[|"]/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (!names.length) return topics[0].query;
  const combined = names.join(' | ');
  if (combined.length <= 150) return combined;
  // A large library is kept intact. Only the provider query uses a small,
  // rotating group, stable within a cache window; ranking uses every favorite.
  const start = Math.floor(now / CACHE_WINDOW) % names.length;
  const selected = [];
  for (let offset = 0; offset < names.length && selected.length < 8; offset++) {
    const name = names[(start + offset) % names.length];
    if ([...selected, name].join(' | ').length <= 150) selected.push(name);
  }
  return selected.join(' | ');
}
const stopwords = new Set(['and', 'the', 'for', 'to', 'of', 'in', 'on', 'with', 'or', 'a']);
const words = text => (text || '').normalize('NFC').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
export function interestScore(item, favorites, history = [], topics = catalog) {
  const text = new Set(words(`${item.snippet?.title || ''} ${item.snippet?.description || ''}`));
  let affinity = 0;
  for (const name of cleanFavorites(favorites, topics)) {
    const topic = topicFromName(name, topics);
    const terms = [...new Set(words(`${topic.name} ${topic.query}`).filter(word => !stopwords.has(word)))];
    const matches = terms.filter(word => text.has(word)).length;
    if (matches) affinity = Math.max(affinity, 0.15 + 0.35 * matches / terms.length);
  }
  const channel = item.snippet?.channelId;
  const count = channel ? history.filter(video => video.snippet?.channelId === channel).length : 0;
  return affinity + Math.min(0.15, count * 0.03);
}
