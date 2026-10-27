import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import ShortsFeed from './shorts-feed';
import { readLibrary } from '../utils/library';
jest.mock('react-player/youtube', () => props => <><button aria-label="Embedded playback" onClick={props.onPlay} /><button aria-label="Embedded pause" onClick={props.onPause} /></>);
global.IS_REACT_ACT_ENVIRONMENT = true;
const videos = ['one', 'two', 'three'].map(id => ({ id: { videoId: id }, isShort: true,
  snippet: { title: `Short ${id}`, channelTitle: 'Creator', channelId: id, thumbnails: {} } }));
let container, root;
beforeEach(() => { localStorage.clear(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = async props => act(async () => root.render(<MemoryRouter><ShortsFeed videos={videos} {...props} /></MemoryRouter>));
const click = async label => act(async () => container.querySelector(`button[aria-label="${label}"]`).click());

test('scroll activates the next Short, stops the previous player, and records only actual playback', async () => {
  await render();
  expect(readLibrary('history')).toEqual([]);
  await click('Embedded playback');
  expect(readLibrary('history').map(item => item.id)).toEqual(['one']);
  const feed = container.querySelector('.shorts-feed');
  Object.defineProperty(feed, 'clientHeight', { value: 500 });
  await act(async () => { feed.scrollTop = 500; Simulate.scroll(feed); });
  expect(container.querySelector('.short-card[data-active="true"]').getAttribute('data-video-id')).toBe('two');
  expect(container.querySelectorAll('button[aria-label="Embedded playback"]')).toHaveLength(1);
  await click('Embedded playback');
  expect(readLibrary('history').map(item => item.id)).toEqual(['two', 'one']);
  await click('Save Short');
  expect(readLibrary('saved').map(item => item.id)).toEqual(['two']);
});

test('swiping near the end loads once per boundary and never fetches just from mounting', async () => {
  const loadMore = jest.fn();
  await render({ hasMore: true, onLoadMore: loadMore });
  expect(loadMore).not.toHaveBeenCalled();
  const feed = container.querySelector('.shorts-feed');
  Object.defineProperty(feed, 'clientHeight', { value: 500 });
  await act(async () => { feed.scrollTop = 1000; Simulate.scroll(feed); Simulate.scroll(feed); });
  expect(loadMore).toHaveBeenCalledTimes(1);
  await act(async () => { feed.scrollTop = 999; Simulate.scroll(feed); feed.scrollTop = 1000; Simulate.scroll(feed); });
  expect(loadMore).toHaveBeenCalledTimes(1);
});


test('the end panel stops off-screen playback and newly appended Shorts become playable', async () => {
  await render();
  const feed = container.querySelector('.shorts-feed');
  Object.defineProperty(feed, 'clientHeight', { value: 500 });
  await act(async () => { feed.scrollTop = 1500; Simulate.scroll(feed); });
  expect(container.querySelector('.short-card[data-active="true"]')).toBeNull();
  expect(container.querySelector('button[aria-label="Embedded playback"]')).toBeNull();
  await render({ videos: [...videos, {...videos[0], id: {videoId:'four'}}] });
  expect(container.querySelector('.short-card[data-active="true"]').getAttribute('data-video-id')).toBe('four');
});

test('visibility suspension preserves playback intent while an intentional pause persists', async () => {
  const hidden = jest.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  try {
    await render();
    await act(async () => { hidden.mockReturnValue(true); document.dispatchEvent(new Event('visibilitychange')); });
    await click('Embedded pause');
    await act(async () => { hidden.mockReturnValue(false); document.dispatchEvent(new Event('visibilitychange')); });
    expect(container.querySelector('button[aria-label="Pause Short"]')).not.toBeNull();
    await click('Pause Short');
    await act(async () => { hidden.mockReturnValue(true); document.dispatchEvent(new Event('visibilitychange')); });
    await act(async () => { hidden.mockReturnValue(false); document.dispatchEvent(new Event('visibilitychange')); });
    expect(container.querySelector('button[aria-label="Play Short"]')).not.toBeNull();
  } finally { hidden.mockRestore(); }
});
