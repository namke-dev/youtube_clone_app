import { selectEdition, editionLanes } from './edition';
import { durationSeconds, durationLabel, publishedLabel } from './video-metadata';

const video = (id, seconds = 360) => ({ id: { videoId: id }, snippet: { title: id }, contentDetails: { duration: `PT${seconds}S` } });
const lanes = () => editionLanes.map((lane, i) => ({ ...lane, items: Array.from({length: 8}, (_, n) => video(`${i}-${n}`)) }));

test('a small edition covers every available lane without repeating a video', () => {
  const result = selectEdition(lanes());
  expect(result).toHaveLength(4);
  expect(new Set(result.map(pick => pick.lane.id)).size).toBe(3);
  expect(new Set(result.map(pick => pick.video.id.videoId)).size).toBe(4);
  expect(result.reduce((sum, pick) => sum + durationSeconds(pick.video), 0)).toBe(1440);
});

test('shuffle is deterministic, uses alternatives and tolerates duplicate or empty lanes', () => {
  const data = lanes();
  expect(selectEdition(data, 1)).toEqual(selectEdition(data, 1));
  expect(selectEdition(data, 1)).not.toEqual(selectEdition(data, 0));
  const same = video('same');
  expect(selectEdition(data.map(lane => ({...lane, items: [same]})))).toHaveLength(1);
  expect(selectEdition(data.map(lane => ({...lane, items: []})))).toEqual([]);
  expect(selectEdition([{...data[0], items: [same, video('other')]}])).toHaveLength(2);
});

test('selection favors a short session when short and long videos are both available', () => {
  const data = lanes().map(lane => ({...lane, items: [video(`${lane.id}-long`, 5400), ...lane.items]}));
  const result = selectEdition(data);
  expect(result.reduce((sum, pick) => sum + durationSeconds(pick.video), 0)).toBeLessThanOrEqual(1800);
});

test('three ten-minute picks do not gain a fourth that pushes a known session past thirty minutes', () => {
  const data = lanes().map(lane => ({...lane, items:lane.items.map(video => ({...video,contentDetails:{duration:'PT10M'}}))}));
  expect(selectEdition(data)).toHaveLength(3);
});

test('duration formatting accepts explicit ISO or clock metadata and rejects malformed values', () => {
  expect(durationSeconds({contentDetails:{duration:'PT1H2M3S'}})).toBe(3723);
  expect(durationLabel({contentDetails:{duration:'PT11M16S'}})).toBe('11:16');
  expect(durationLabel({lengthText:{simpleText:'5:08'}})).toBe('5:08');
  expect(durationLabel({duration:'1:02:03'})).toBe('1:02:03');
  for (const duration of [undefined, 'LIVE', 'P1D', 'PT', '5:99', '-1', 0]) {
    expect(durationSeconds({duration})).toBeNull();
  }
});

test('publication labels never turn missing or invalid dates into freshness claims', () => {
  expect(publishedLabel({snippet:{publishedAt:'2026-11-02T10:00:00Z'}})).toBe('Nov 2, 2026');
  expect(publishedLabel({snippet:{publishedAt:'bad'}})).toBeNull();
  expect(publishedLabel({})).toBeNull();
});
