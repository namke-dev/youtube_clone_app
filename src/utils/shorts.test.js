import { isShort } from './shorts';
import { rankCandidates, createDiscovery } from './discovery';
const video = (id, extra = {}) => ({ id: { videoId: id }, snippet: { title: 'Software architecture', channelId: id }, ...extra });
test.each([
  { isShort: true }, { isShorts: true }, { type: 'shorts' },
  { url: 'https://www.youtube.com/shorts/abc' },
  { snippet: { title: 'Architecture #Shorts', channelId: 'a' } },
  { snippet: { title: 'Architecture', description: 'New lesson #shorts', channelId: 'a' } },
])('detects explicit Shorts metadata: %j', extra => {
  expect(isShort(video('short', extra))).toBe(true);
});
test('keeps normal brief videos, ordinary short-related words, and channel results', () => {
  expect(isShort(video('brief', { contentDetails: { duration: 'PT45S' } }))).toBe(false);
  expect(isShort(video('normal', { snippet: { title: 'Short stories and keyboard shortcuts' } }))).toBe(false);
  expect(isShort({ id: { channelId: 'channel' }, snippet: { title: '#shorts channel' } })).toBe(false);
});
test('ranking excludes Shorts without letting them consume channel diversity slots', () => {
  const items = [video('short', { isShort: true }), video('normal')];
  expect(rankCandidates(items).map(v => v.id.videoId)).toEqual(['normal']);
});
test('cached searches and refreshes exclude Shorts without additional API calls', async () => {
  const fetcher = jest.fn().mockResolvedValue({ items: [video('short', { isShort: true }), video('normal')] });
  const discovery = createDiscovery(fetcher);
  expect((await discovery.discover('software')).items.map(v => v.id.videoId)).toEqual(['normal']);
  expect((await discovery.discover('SOFTWARE')).items.map(v => v.id.videoId)).toEqual(['normal']);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

test('Shorts ranking separates formats, excludes watched videos, and caps each creator', () => {
  const short = (id, channelId) => video(id, { isShort: true, snippet: { title: 'Software #shorts', channelId } });
  const items = [video('normal'), { id: { channelId: 'channel' }, snippet: { title: '#shorts channel' } },
    short('watched', 'a'), short('a1', 'a'), short('a2', 'a'), short('a3', 'a'), short('b1', 'b')];
  expect(rankCandidates(items, { format: 'shorts', watchedIds: new Set(['watched']), random: () => 0 })
    .map(item => item.id.videoId)).toEqual(['a1', 'a2', 'b1']);
});

test('Shorts search targets every OR topic and refreshes from its own cached pool', async () => {
  const short = video('short', { isShort: true });
  const fetcher = jest.fn().mockResolvedValue({ items: [short, video('normal')] });
  const discovery = createDiscovery(fetcher);
  expect((await discovery.discover('AI | Physics', { format: 'shorts', includeChannels: true })).items).toEqual([short]);
  expect((await discovery.discover('ai | physics', { format: 'shorts' })).items).toEqual([short]);
  expect(fetcher).toHaveBeenCalledTimes(1);
  const params = new URLSearchParams(fetcher.mock.calls[0][0].split('?')[1]);
  expect(params.get('q')).toBe('ai #shorts | physics #shorts');
  expect(params.get('type')).toBe('video');
  expect(params.get('maxResults')).toBe('50');
  expect((await discovery.discover('AI | Physics')).items.map(item => item.id.videoId)).toEqual(['normal']);
});

test('appending Shorts retains played entries so a swipe never replaces the current feed', async () => {
  const shorts = ['s1', 's2', 's3'].map(id => video(id, { isShort: true }));
  const discovery = createDiscovery(async () => ({ items: shorts }));
  const first = await discovery.discover('swipe', { format: 'shorts', limit: 2, random: () => 0 });
  const next = await discovery.discover('swipe', { format: 'shorts', limit: 2, loadMore: true,
    previous: first.items, watchedIds: new Set(['s1']), random: () => 0 });
  expect(next.items.map(item => item.id.videoId)).toEqual(['s1', 's2', 's3']);
});
