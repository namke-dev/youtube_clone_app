import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import ShortsFeed from './shorts-feed';
import { readLibrary } from '../utils/library';
let mockPlayerProps, mockInternal, mockListeners, mockNativeMuted;
jest.mock('react-player/youtube', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => {
    mockPlayerProps = props;
    React.useImperativeHandle(ref, () => ({ getInternalPlayer: () => mockInternal }));
    React.useEffect(() => { props.onReady?.({ getInternalPlayer: () => mockInternal }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return <><button aria-label="Embedded playback" onClick={props.onPlay} /><button aria-label="Embedded pause" onClick={props.onPause} /></>;
  });
});
global.IS_REACT_ACT_ENVIRONMENT = true;
const videos = ['one', 'two', 'three'].map(id => ({ id: { videoId: id }, isShort: true,
  snippet: { title: `Short ${id}`, channelTitle: 'Creator', channelId: id, thumbnails: {} } }));
let container, root;
beforeEach(() => {
  localStorage.clear(); mockNativeMuted = false; mockListeners = {};
  mockInternal = {
    isMuted: jest.fn(() => mockNativeMuted),
    mute: jest.fn(() => { mockNativeMuted = true; }),
    unMute: jest.fn(() => { mockNativeMuted = false; }),
    playVideo: jest.fn(), pauseVideo: jest.fn(),
    addEventListener: jest.fn((event, name) => { mockListeners[event] = name; }),
    removeEventListener: jest.fn(),
  };
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
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
  expect(container.querySelector('.short-live-slot').getAttribute('aria-hidden')).toBe('true');
  expect(mockPlayerProps.playing).toBe(false);
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


test('Shorts attempts audible playback rather than forcing each video to start muted', async () => {
  await render();
  expect(mockPlayerProps.muted).toBe(false);
  expect(container.querySelector('button[aria-label="Mute Short"]')).not.toBeNull();
});

test('native YouTube sound changes survive swipes in the same player', async () => {
  await render();
  const embedded = container.querySelector('button[aria-label="Embedded playback"]');
  const soundButton = container.querySelector('button[aria-label="Mute Short"]');
  if (soundButton) await act(async () => soundButton.click());
  mockNativeMuted = false; // The user unmutes using YouTube's native control.
  await act(async () => mockPlayerProps.onProgress?.());
  expect(container.querySelector('button[aria-label="Mute Short"]')).not.toBeNull();
  const feed = container.querySelector('.shorts-feed');
  Object.defineProperty(feed, 'clientHeight', { value: 500 });
  await act(async () => { feed.scrollTop = 500; Simulate.scroll(feed); });
  expect(container.querySelector('button[aria-label="Embedded playback"]')).toBe(embedded);
  expect(mockPlayerProps.url).toBe('https://www.youtube.com/watch?v=two');
  expect(mockPlayerProps.muted).toBe(false);
  await click('Mute Short');
  await act(async () => { feed.scrollTop = 1000; Simulate.scroll(feed); });
  expect(mockPlayerProps.muted).toBe(true);
});

test('blocked audible autoplay offers a direct one-tap play-with-sound recovery', async () => {
  await render();
  expect(typeof mockListeners.onAutoplayBlocked).toBe('string');
  await act(async () => window[mockListeners.onAutoplayBlocked]());
  const play = [...container.querySelectorAll('button')].find(button => button.textContent === 'Play with sound');
  expect(play).toBeDefined();
  await act(async () => play.click());
  expect(mockInternal.unMute).toHaveBeenCalledTimes(1);
  expect(mockInternal.playVideo).toHaveBeenCalledTimes(1);
  expect(mockPlayerProps.muted).toBe(false);
});

test('late playback after scrolling to the end is stopped instead of playing hidden audio', async () => {
  await render();
  const feed = container.querySelector('.shorts-feed');
  Object.defineProperty(feed, 'clientHeight', { value: 500 });
  await act(async () => { feed.scrollTop = 1500; Simulate.scroll(feed); });
  mockInternal.pauseVideo.mockClear();
  await act(async () => mockPlayerProps.onPlay());
  expect(mockInternal.pauseVideo).toHaveBeenCalledTimes(1);
  expect(readLibrary('history')).toEqual([]);
});

test('delayed previous-video events cannot record or fail the newly selected Short', async () => {
  await render();
  mockInternal.getVideoData = () => ({ video_id: 'one' });
  const feed = container.querySelector('.shorts-feed');
  Object.defineProperty(feed, 'clientHeight', { value: 500 });
  await act(async () => { feed.scrollTop = 500; Simulate.scroll(feed); });
  await act(async () => { mockPlayerProps.onPlay(); mockPlayerProps.onError(150); });
  expect(readLibrary('history')).toEqual([]);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  mockInternal.getVideoData = () => ({ video_id: 'two' });
  await act(async () => mockPlayerProps.onPlay());
  expect(readLibrary('history').map(item => item.id)).toEqual(['two']);
});

test('an explicit sound choice is retained when the feed refreshes', async () => {
  await render();
  await click('Mute Short');
  await render({ key: 'refreshed' });
  expect(mockPlayerProps.muted).toBe(true);
  await click('Turn sound on');
  await render({ key: 'refreshed-again' });
  expect(mockPlayerProps.muted).toBe(false);
});
