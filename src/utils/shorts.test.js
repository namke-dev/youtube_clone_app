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
