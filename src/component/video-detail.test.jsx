import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import VideoDetail from './video-detail';
import { recordHistory, readLibrary } from '../utils/library';
import ReactPlayer from 'react-player/youtube';
import { readAutoFullscreen } from '../utils/playback';
jest.mock('axios');
jest.mock('react-player/youtube', () => ({ __esModule: true, default: jest.fn(() => null) }));
global.IS_REACT_ACT_ENVIRONMENT = true;

test('related discovery requests 50 but selects 12 diverse, unwatched videos', async () => {
  localStorage.clear();
  const item = i => ({ id: { videoId: `related-${i}` }, snippet: { title: `Film ${i}`, channelId: i < 5 ? 'same' : `channel-${i}`, thumbnails: {} } });
  recordHistory(item(10));
  axios.get.mockResolvedValueOnce({ data: { items: [{ id: 'current-related-test', snippet: { title: 'Film', channelId: 'current', thumbnails: {} } }] } })
    .mockResolvedValueOnce({ data: { items: Array.from({ length: 50 }, (_, i) => item(i)) } });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/video/current-related-test']}><Routes><Route path="/video/:id" element={<VideoDetail />} /></Routes></MemoryRouter>));
    await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Find related videos').click());
    const cards = [...container.querySelectorAll('.watch-next .video-card')];
    expect(cards).toHaveLength(12);
    expect(container.querySelector('.watch-next a[href="/video/related-10"]')).toBeNull();
    expect(container.querySelectorAll('.watch-next .video-meta a[href="/channel/same"]').length).toBeLessThanOrEqual(2);
    const endpoint = new URL(axios.get.mock.calls[1][0], 'https://local.test').searchParams.get('endpoint');
    expect(endpoint).toContain('maxResults=50');
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});


test('watch page requests autoplay and saves opt-in fullscreen without recording history before playback', async () => {
  localStorage.clear();
  ReactPlayer.mockClear();
  axios.get.mockResolvedValue({ data: { items: [{ id: 'autoplay-test', snippet: { title: 'Autoplay test', channelId: 'creator', thumbnails: {} } }] } });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/video/autoplay-test']}><Routes><Route path="/video/:id" element={<VideoDetail />} /></Routes></MemoryRouter>));
    const props = ReactPlayer.mock.calls.at(-1)[0];
    expect(props.playing).toBe(true);
    expect(props.playsinline).toBe(true);
    expect(props.muted).toBe(false);
    expect(readLibrary('history')).toEqual([]);
    act(() => props.onPlay());
    expect(readLibrary('history').map(v => v.id)).toEqual(['autoplay-test']);
    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(false);
    act(() => Simulate.change(checkbox, { target: { checked: true } }));
    expect(readAutoFullscreen()).toBe(true);
    const requestFullscreen = jest.fn().mockResolvedValue();
    container.querySelector('.player').requestFullscreen = requestFullscreen;
    await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Fullscreen').click());
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

test('automatic fullscreen survives navigation from one watch page to a related video', async () => {
  localStorage.clear();
  localStorage.setItem('devtubes:auto-fullscreen', 'true');
  const item = id => ({ id, snippet: { title: id, channelId: id, thumbnails: {} } });
  axios.get.mockImplementation(url => {
    const endpoint = new URL(url, 'https://local.test').searchParams.get('endpoint');
    if (endpoint.includes('relatedToVideoId=fullscreen-from')) return Promise.resolve({ data: { items: [item('fullscreen-to')] } });
    return Promise.resolve({ data: { items: [item(endpoint.includes('id=fullscreen-to') ? 'fullscreen-to' : 'fullscreen-from')] } });
  });
  document.documentElement.requestFullscreen = jest.fn().mockResolvedValue();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/video/fullscreen-from']}><Routes><Route path="/video/:id" element={<VideoDetail />} /></Routes></MemoryRouter>));
    await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Find related videos').click());
    await act(async () => container.querySelector('.watch-next a.thumbnail').click());
    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
    expect(container.querySelector('h1').textContent).toBe('fullscreen-to');
    expect(document.documentElement.classList.contains('video-fullscreen')).toBe(true);
  } finally {
    act(() => root.unmount());
    container.remove();
    delete document.documentElement.requestFullscreen;
    document.documentElement.classList.remove('video-fullscreen');
  }
});


test('unsupported fullscreen expands the video, offers an exit and restores inline view with Escape', async () => {
  localStorage.clear();
  axios.get.mockResolvedValue({ data: { items: [{ id: 'iphone-fallback', snippet: { title: 'iPhone fallback', channelId: 'a', thumbnails: {} } }] } });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/video/iphone-fallback']}><Routes><Route path="/video/:id" element={<VideoDetail />} /></Routes></MemoryRouter>));
    await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Fullscreen').click());
    expect(document.documentElement.classList.contains('video-expanded')).toBe(true);
    expect([...container.querySelectorAll('button')].some(b => b.textContent === 'Exit fullscreen')).toBe(true);
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(document.documentElement.classList.contains('video-expanded')).toBe(false);
    expect([...container.querySelectorAll('button')].some(b => b.textContent === 'Exit fullscreen')).toBe(false);
  } finally {
    act(() => root.unmount());
    container.remove();
    document.documentElement.classList.remove('video-expanded');
  }
});

test('expanded playback can be closed even when video metadata fails', async () => {
  localStorage.clear();
  document.documentElement.classList.add('video-expanded');
  axios.get.mockRejectedValue(new Error('offline'));
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/video/iphone-failed-metadata']}><Routes><Route path="/video/:id" element={<VideoDetail />} /></Routes></MemoryRouter>));
    const exit = [...container.querySelectorAll('button')].find(b => b.textContent === 'Exit fullscreen');
    expect(exit).toBeDefined();
    await act(async () => exit.click());
    expect(document.documentElement.classList.contains('video-expanded')).toBe(false);
  } finally {
    act(() => root.unmount());
    container.remove();
    document.documentElement.classList.remove('video-expanded');
  }
});

test('phone autoplay starts muted, enables sound during a tap, and rotates fullscreen with a portrait override', async () => {
  localStorage.clear();
  const userAgent = jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla iPhone');
  ReactPlayer.mockClear();
  axios.get.mockResolvedValue({ data: { items: [{ id: 'mobile-autoplay-landscape', snippet: { title: 'Phone playback', channelId: 'a', thumbnails: {} } }] } });
  const internal = { unMute: jest.fn(), playVideo: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn() };
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/video/mobile-autoplay-landscape']}><Routes><Route path="/video/:id" element={<VideoDetail />} /></Routes></MemoryRouter>));
    let props = ReactPlayer.mock.calls.at(-1)[0];
    expect(props.playing).toBe(true);
    expect(props.muted).toBe(true);
    act(() => props.onReady({ getInternalPlayer: () => internal }));
    await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Tap for sound').click());
    expect(internal.unMute).toHaveBeenCalledTimes(1);
    expect(internal.playVideo).toHaveBeenCalledTimes(1);
    expect(ReactPlayer.mock.calls.at(-1)[0].muted).toBe(false);
    await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Fullscreen').click());
    expect(document.documentElement.classList.contains('video-landscape')).toBe(true);
    act(() => [...container.querySelectorAll('button')].find(b => b.textContent === 'Rotate view').click());
    expect(document.documentElement.classList.contains('video-landscape')).toBe(false);
    const blocked = internal.addEventListener.mock.calls.find(([event]) => event === 'onAutoplayBlocked')[1];
    expect(typeof blocked).toBe('string');
    act(() => window[blocked]());
    expect([...container.querySelectorAll('button')].some(b => b.textContent === 'Tap to play')).toBe(true);
    await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Tap to play').click());
    expect(internal.playVideo).toHaveBeenCalledTimes(2);
  } finally {
    act(() => root.unmount());
    container.remove();
    userAgent.mockRestore();
    document.documentElement.classList.remove('video-expanded', 'video-landscape');
  }
});

test('saved button follows library ownership when the account changes on the same video', async () => {
  const { setLibraryOwner, saveVideo } = require('../utils/library');
  localStorage.clear();
  const video = {id:'owner-switch-watch',snippet:{title:'Owner switch',channelId:'a',thumbnails:{}}};
  setLibraryOwner(null);
  saveVideo(video);
  axios.get.mockResolvedValue({data:{items:[video]}});
  const container=document.createElement('div');document.body.appendChild(container);
  const root=createRoot(container);
  try {
    await act(async()=>root.render(<MemoryRouter initialEntries={['/video/owner-switch-watch']}><Routes><Route path="/video/:id" element={<VideoDetail/>}/></Routes></MemoryRouter>));
    const savedButton=()=>container.querySelector('.actions button');
    expect(savedButton().textContent).toBe('Saved');
    act(()=>setLibraryOwner('different-user'));
    expect(savedButton().textContent).toBe('Save');
    act(()=>savedButton().click());
    expect(readLibrary('saved').map(v=>v.id)).toEqual(['owner-switch-watch']);
    act(()=>setLibraryOwner(null));
    expect(savedButton().textContent).toBe('Saved');
  } finally {act(()=>root.unmount());container.remove();setLibraryOwner(null);}
});

test('autoplay and saving wait for account restoration without writing guest history', async () => {
  const {AccountProvider}=require('../context/account-context');
  localStorage.clear();
  let restore;
  const session=new Promise(resolve=>{restore=resolve;});
  const service={configured:true,getSession:()=>session,subscribe:()=>()=>{},loadFavorites:async()=>[]};
  const video={id:'pending-owner',snippet:{title:'Pending owner',channelId:'a',thumbnails:{}}};
  axios.get.mockResolvedValue({data:{items:[video]}});
  const container=document.createElement('div');document.body.appendChild(container);const root=createRoot(container);
  try {
    await act(async()=>root.render(<AccountProvider service={service}><MemoryRouter initialEntries={['/video/pending-owner']}><Routes><Route path="/video/:id" element={<VideoDetail/>}/></Routes></MemoryRouter></AccountProvider>));
    expect(ReactPlayer.mock.calls.at(-1)[0].playing).toBe(false);
    expect(container.querySelector('.actions button').disabled).toBe(true);
    act(()=>ReactPlayer.mock.calls.at(-1)[0].onPlay());
    expect(readLibrary('history')).toEqual([]);
    await act(async()=>restore({user:{id:'restored-owner'}}));
    expect(ReactPlayer.mock.calls.at(-1)[0].playing).toBe(true);
    act(()=>ReactPlayer.mock.calls.at(-1)[0].onPlay());
    expect(readLibrary('history').map(v=>v.id)).toEqual(['pending-owner']);
    expect(localStorage.getItem('devtubes:history')).toBeNull();
  } finally {act(()=>root.unmount());container.remove();}
});

test('fullscreen controls compact after three seconds and the exit remains a one-tap action', async () => {
  jest.useFakeTimers();
  const agent = jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla iPhone');
  localStorage.clear();
  axios.get.mockResolvedValue({data:{items:[{id:'hide-controls',snippet:{title:'Fullscreen controls',channelId:'a',thumbnails:{}}}]}});
  const container=document.createElement('div'); document.body.appendChild(container); const root=createRoot(container);
  try {
    await act(async()=>root.render(<MemoryRouter><VideoDetail/></MemoryRouter>));
    await act(async()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='Fullscreen').click());
    const player=container.querySelector('.player');
    expect(player.classList.contains('fullscreen-controls-hidden')).toBe(false);
    act(()=>jest.advanceTimersByTime(2999));
    expect(player.classList.contains('fullscreen-controls-hidden')).toBe(false);
    act(()=>jest.advanceTimersByTime(1));
    expect(player.classList.contains('fullscreen-controls-hidden')).toBe(true);
    act(()=>Simulate.pointerMove(player,{pointerType:'mouse'}));
    expect(player.classList.contains('fullscreen-controls-hidden')).toBe(false);
    act(()=>jest.advanceTimersByTime(3000));
    act(()=>ReactPlayer.mock.calls.at(-1)[0].onPause());
    expect(player.classList.contains('fullscreen-controls-hidden')).toBe(false);
    act(()=>jest.advanceTimersByTime(3000));
    const exit=container.querySelector('.fullscreen-exit');
    act(()=>{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}));exit.focus();});
    act(()=>jest.advanceTimersByTime(5000));
    expect(player.classList.contains('fullscreen-controls-hidden')).toBe(false);
    const outside=document.createElement('button');container.appendChild(outside);
    act(()=>outside.focus());
    act(()=>jest.advanceTimersByTime(3000));
    expect(player.classList.contains('fullscreen-controls-hidden')).toBe(true);
    await act(async()=>{Simulate.pointerDown(exit,{pointerType:'touch'});exit.click();});
    expect(document.documentElement.classList.contains('video-expanded')).toBe(false);
  } finally {act(()=>root.unmount());container.remove();agent.mockRestore();jest.useRealTimers();}
});
