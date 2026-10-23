import { topics as catalog } from './topics';

export const MAX_FAVORITES = 8;
export function cleanFavorites(values, topics = catalog) {
  if (!Array.isArray(values)) return [];
  const known = new Set(topics.slice(1).map(topic => topic.name));
  return [...new Set(values.filter(value => known.has(value)))].slice(0, MAX_FAVORITES);
}
export function favoriteTopicBar(favorites, topics = catalog, current) {
  const names = cleanFavorites(favorites, topics);
  if (!names.length) return topics;
  if (current && current !== topics[0].name && !names.includes(current)) names.push(current);
  return [topics[0], ...names.map(name => topics.find(topic => topic.name === name)).filter(Boolean)];
}
export function forYouQuery(favorites, topics = catalog) {
  const names = cleanFavorites(favorites, topics);
  return names.length
    ? names.map(name => topics.find(topic => topic.name === name).query).join(' | ')
    : topics[0].query;
}
const stopwords = new Set(['and', 'the', 'for', 'to', 'of', 'in', 'on', 'with', 'or', 'a']);
const words = text => (text || '').toLowerCase().match(/[a-z0-9]+/g) || [];
export function interestScore(item, favorites, history = [], topics = catalog) {
  const text = new Set(words(`${item.snippet?.title || ''} ${item.snippet?.description || ''}`));
  let affinity = 0;
  for (const name of cleanFavorites(favorites, topics)) {
    const topic = topics.find(value => value.name === name);
    const terms = [...new Set(words(`${topic.name} ${topic.query}`).filter(word => !stopwords.has(word)))];
    const matches = terms.filter(word => text.has(word)).length;
    if (matches) affinity = Math.max(affinity, 0.15 + 0.35 * matches / terms.length);
  }
  const channel = item.snippet?.channelId;
  const count = channel ? history.filter(video => video.snippet?.channelId === channel).length : 0;
  return affinity + Math.min(0.15, count * 0.03);
}
