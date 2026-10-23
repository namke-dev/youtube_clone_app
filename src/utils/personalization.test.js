import { cleanFavorites, favoriteTopicBar, forYouQuery, interestScore } from './personalization';
import { rankCandidates } from './discovery';
const topics = [
  { name: 'For you', query: 'curious ideas' },
  { name: 'AI', query: 'AI engineering agents' },
  { name: 'Physics', query: 'physics science universe' },
  { name: 'Apple', query: 'Apple Mac iPhone' },
];
test('favorites are known, deduplicated and capped', () => {
  expect(cleanFavorites(['AI', 'missing', 'AI', 'Physics', 'For you'], topics)).toEqual(['AI', 'Physics']);
  expect(cleanFavorites('AI', topics)).toEqual([]);
  const catalog = Array.from({length: 12}, (_, i) => ({name: String(i+1)}));
  expect(cleanFavorites(catalog.map(t => t.name), [{name:'For you'}, ...catalog])).toHaveLength(8);
});
test('favorite topic bar puts For you first, includes current topic and keeps guest catalog when empty', () => {
  expect(favoriteTopicBar(['Physics'], topics).map(t => t.name)).toEqual(['For you', 'Physics']);
  expect(favoriteTopicBar(['Physics'], topics, 'Apple').map(t => t.name)).toEqual(['For you', 'Physics', 'Apple']);
  expect(favoriteTopicBar([], topics)).toEqual(topics);
});
test('For you creates one combined favorite query and keeps default guest query', () => {
  expect(forYouQuery(['AI', 'Physics'], topics)).toBe('AI engineering agents | physics science universe');
  expect(forYouQuery([], topics)).toBe('curious ideas');
});
test('favorite relevance boosts discovery without false AI substring matches', () => {
  const ai = {id:'a', snippet:{title:'AI agents explained', channelId:'a'}};
  const daily = {id:'b', snippet:{title:'Daily cooking tips', channelId:'b'}};
  expect(interestScore(ai, ['AI'], [], topics)).toBeGreaterThan(interestScore(daily, ['AI'], [], topics));
  expect(interestScore(daily, ['AI'], [], topics)).toBe(0);
  expect(rankCandidates([daily, ai], {random: () => 0, personalInterest: v => interestScore(v, ['AI'], [], topics)}).map(v => v.id)).toEqual(['a','b']);
});
test('own watch history supplies a bounded channel-interest bonus', () => {
  const item={id:'new', snippet:{title:'Something new', channelId:'known'}};
  expect(interestScore(item, [], [{id:'old', snippet:{channelId:'known'}}], topics)).toBeGreaterThan(0);
  expect(interestScore(item, [], [], topics)).toBe(0);
  expect(interestScore(item, [], Array(100).fill({snippet:{channelId:'known'}}), topics)).toBeLessThanOrEqual(0.15);
});
