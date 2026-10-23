import { fetchFromApi } from './fetchFromApi';
import { videoId } from './library';
import { isShort } from './shorts';

const POOL_TTL = 30 * 60 * 1000;
const normalize = value => value.trim().replace(/\s+/g, ' ').toLowerCase();
const resultKey = item => item?.id?.channelId
  ? `channel:${item.id.channelId}`
  : videoId(item) ? `video:${videoId(item)}` : undefined;
const channelKey = item => item?.id?.channelId || item?.snippet?.channelId;

// History is excluded by default. Hooks can later consume account interests or
// progress without changing the shared, unpersonalized candidate pool.
export function rankCandidates(items, {
  query = '', watchedIds = new Set(), previous = [], limit = 24,
  now = Date.now(), random = Math.random,
  personalInterest = () => 0, watchedPenalty = () => 0,
  repeatedChannelPenalty = () => 0,
} = {}) {
  const seen = new Set(previous.map(resultKey));
  const counts = new Map();
  previous.forEach(item => {
    const channel = channelKey(item);
    if (channel) counts.set(channel, (counts.get(channel) || 0) + 1);
  });
  const words = normalize(query).split(' ').filter(Boolean);
  const candidates = [];
  items.forEach((item, index) => {
    const key = resultKey(item);
    if (!key || !item.snippet || seen.has(key) || isShort(item)) return;
    seen.add(key);
    if (!item.id?.channelId && watchedIds.has(videoId(item))) return;
    const title = (item.snippet.title || '').toLowerCase();
    const relevance = words.length ? words.filter(word => title.includes(word)).length / words.length : 0;
    const published = Date.parse(item.snippet.publishedAt);
    const age = Math.max(0, now - published) / (24 * 60 * 60 * 1000);
    const freshness = Number.isFinite(age) ? 1 / (1 + age / 180) : 0;
    candidates.push({ item, score: relevance * 0.5
      + 0.1 * (1 - index / Math.max(items.length, 1))
      + freshness * 0.2 + random() * 0.18
      + personalInterest(item) - watchedPenalty(item) });
  });
  const selected = [];
  while (candidates.length && selected.length < limit) {
    candidates.sort((a, b) =>
      (b.score - repeatedChannelPenalty(b.item, counts.get(channelKey(b.item)) || 0))
      - (a.score - repeatedChannelPenalty(a.item, counts.get(channelKey(a.item)) || 0)));
    const { item } = candidates.shift();
    const channel = channelKey(item);
    if (channel && (counts.get(channel) || 0) >= 2) continue;
    selected.push(item);
    if (channel) counts.set(channel, (counts.get(channel) || 0) + 1);
  }
  return selected;
}

export function createDiscovery(fetcher = fetchFromApi, clock = Date.now) {
  const pools = new Map();
  const pending = new Map();
  async function getPool(endpoint) {
    const cached = pools.get(endpoint);
    if (cached && cached.expires > clock()) return { pool: cached, fresh: false };
    if (!pending.has(endpoint)) {
      pending.set(endpoint, fetcher(endpoint).then(data => {
        const pool = { items: data.items, token: data.nextPageToken || '', expires: clock() + POOL_TTL };
        if (pools.size >= 80) pools.delete(pools.keys().next().value);
        pools.set(endpoint, pool);
        return { pool, fresh: true };
      }).finally(() => pending.delete(endpoint)));
    }
    return pending.get(endpoint);
  }
  return {
    async discover(query, options = {}) {
      const normalized = normalize(query);
      const endpoint = `search?part=snippet,id&type=${options.includeChannels ? 'video,channel' : 'video'}&maxResults=50&q=${encodeURIComponent(normalized)}`;
      const { pool, fresh } = await getPool(endpoint);
      const watchedIds = options.watchedIds || new Set();
      const previous = options.loadMore && !fresh
        ? (options.previous || []).filter(item => item.id?.channelId || !watchedIds.has(videoId(item))) : [];
      const selection = { ...options, query: normalized, previous, watchedIds, now: clock() };
      let items = rankCandidates(pool.items, selection);
      // Explicit pagination alone may spend another call. Never prefetch for
      // refresh, even if history or channel diversity leaves a short selection.
      if (options.loadMore && !fresh && !items.length && pool.token) {
        if (!pool.more) {
          const token = pool.token;
          pool.more = fetcher(`${endpoint}&pageToken=${encodeURIComponent(token)}`).then(data => {
            const seen = new Set(pool.items.map(resultKey));
            pool.items = [...pool.items, ...data.items.filter(item => {
              const key = resultKey(item);
              if (!key || seen.has(key)) return false;
              seen.add(key);
              return true;
            })];
            pool.token = data.nextPageToken && data.nextPageToken !== token ? data.nextPageToken : '';
          }).finally(() => { pool.more = null; });
        }
        await pool.more;
        items = rankCandidates(pool.items, selection);
      }
      const combined = [...previous, ...items];
      return {
        items: combined,
        hasMore: Boolean(pool.token) || rankCandidates(pool.items, { ...selection, previous: combined, limit: 1, random: () => 0 }).length > 0,
      };
    },
  };
}
export const discovery = createDiscovery();
