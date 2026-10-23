import { rankCandidates, createDiscovery } from './discovery';
const now = Date.parse('2026-10-23T00:00:00Z');
const video = (id, channelId = id, title = 'Philosophy', publishedAt) => ({ id: { videoId: id }, snippet: { channelId, title, publishedAt } });
const ids = (items) => items.map(v => v.id.videoId || v.id.channelId);
const options = { query: 'philosophy', now, random: () => 0 };

test('relevance outweighs unrelated fresh results and freshness breaks equal relevance', () => {
  const items = [video('unrelated', 'a', 'Cooking', new Date(now).toISOString()), video('old', 'b', 'Philosophy', '2000-01-01'), video('fresh', 'c', 'Philosophy', new Date(now).toISOString())];
  expect(ids(rankCandidates(items, options))).toEqual(['fresh', 'old', 'unrelated']);
});
test('exploration can change ordering without mutating the pool', () => {
  const items = [video('a'), video('b')];
  expect(ids(rankCandidates(items, { ...options, random: () => 0 }))).toEqual(['a', 'b']);
  const random = jest.fn().mockReturnValueOnce(0).mockReturnValueOnce(1);
  expect(ids(rankCandidates(items, { ...options, random }))).toEqual(['b', 'a']);
  expect(ids(items)).toEqual(['a', 'b']);
});
test('filters watched video IDs, deduplicates and preserves channel results', () => {
  const channel = { id: { channelId: 'a' }, snippet: { title: 'Philosophy' } };
  expect(ids(rankCandidates([video('a'), video('b'), video('b'), channel, {}], { ...options, watchedIds: new Set(['a']) }))).toEqual(['b', 'a']);
});
test('caps each channel at two across the selection including previously displayed results', () => {
  const items = [video('a', 'same'), video('b', 'same'), video('c', 'same'), video('d', 'other')];
  expect(ids(rankCandidates(items, options))).toEqual(['a', 'b', 'd']);
  expect(ids(rankCandidates(items, { ...options, previous: [items[0]] }))).toEqual(['b', 'd']);
});
test('supports interest, watched and repeated-channel penalty hooks with missing dates/channels', () => {
  const items = [video('a'), video('b'), video('c'), video('d', undefined, 'Philosophy', 'invalid')];
  expect(ids(rankCandidates(items, { ...options, personalInterest: v => v.id.videoId === 'b' ? 2 : 0, watchedPenalty: v => v.id.videoId === 'a' ? 3 : 0, repeatedChannelPenalty: v => v.id.videoId === 'c' ? 4 : 0 }))).toEqual(['b', 'd', 'a', 'c']);
});

describe('candidate pool', () => {
  let fetcher, discovery, time;
  beforeEach(() => {
    time = now;
    fetcher = jest.fn().mockResolvedValue({ items: Array.from({ length: 50 }, (_, i) => video(String(i))), nextPageToken: 'next' });
    discovery = createDiscovery(fetcher, () => time);
  });
  test('normalizes keywords, requests 50, retains all candidates and reranks repeated searches locally', async () => {
    const first = await discovery.discover(' Philosophy  ', { random: () => 0 });
    const second = await discovery.discover('PHILOSOPHY', { random: () => 1, watchedIds: new Set(ids(first.items)) });
    expect(first.items).toHaveLength(24);
    expect(second.items).toHaveLength(24);
    expect(second.items.some(v => ids(first.items).includes(v.id.videoId))).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toContain('maxResults=50&q=philosophy');
  });
  test('deduplicates concurrent searches and keeps channel searches separate', async () => {
    await Promise.all([discovery.discover('a'), discovery.discover('A')]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await discovery.discover('a', { includeChannels: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  test('load more drains local candidates before requesting next page and merges without duplicates', async () => {
    let result = await discovery.discover('a', { random: () => 0 });
    result = await discovery.discover('a', { previous: result.items, loadMore: true, random: () => 0 });
    expect(result.items).toHaveLength(48);
    result = await discovery.discover('a', { previous: result.items, loadMore: true, random: () => 0 });
    expect(result.items).toHaveLength(50);
    expect(fetcher).toHaveBeenCalledTimes(1);
    fetcher.mockResolvedValue({ items: [video('49'), video('50')], nextPageToken: 'next' });
    result = await discovery.discover('a', { previous: result.items, loadMore: true });
    expect(result.items).toHaveLength(51);
    expect(result.hasMore).toBe(false);
    expect(fetcher.mock.calls[1][0]).toContain('pageToken=next');
    expect((await discovery.discover('a')).items).toHaveLength(24);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  test('expires pools after 30 minutes and restarts pagination from page one', async () => {
    const first = await discovery.discover('a');
    time += 30 * 60 * 1000;
    await discovery.discover('a', { loadMore: true, previous: first.items });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][0]).not.toContain('pageToken');
  });
  test('failed reads are retryable and empty watched pools never fetch extra pages automatically', async () => {
    fetcher.mockRejectedValueOnce(new Error('offline'));
    await expect(discovery.discover('a')).rejects.toThrow('offline');
    const result = await discovery.discover('a', { watchedIds: new Set(Array.from({length: 50}, (_, i) => String(i))) });
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

test('a failed explicit next page preserves the existing pool and can be retried', async () => {
  const fetcher = jest.fn().mockResolvedValueOnce({ items: [video('a')], nextPageToken: 'next' })
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ items: [video('b')] });
  const discovery = createDiscovery(fetcher, () => now);
  const first = await discovery.discover('retry');
  await expect(discovery.discover('retry', { loadMore: true, previous: first.items })).rejects.toThrow('offline');
  expect(ids((await discovery.discover('retry')).items)).toEqual(['a']);
  const result = await discovery.discover('retry', { loadMore: true, previous: first.items });
  expect(ids(result.items)).toEqual(['a', 'b']);
  expect(result.hasMore).toBe(false);
});

test('unknown channels are not grouped together and missing dates do not exclude candidates', () => {
  const items = ['a', 'b', 'c'].map(id => ({ id, snippet: { title: 'Philosophy' } }));
  expect(rankCandidates(items, options)).toHaveLength(3);
});
