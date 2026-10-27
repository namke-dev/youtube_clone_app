import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import HomePage from './home-page';
import Header from './header';
import { recordHistory } from '../utils/library';
jest.mock('axios');
global.IS_REACT_ACT_ENVIRONMENT = true;
const items = Array.from({ length: 50 }, (_, i) => ({
  id: { videoId: `ui-${i}` },
  snippet: { title: `Philosophy ${i}`, channelId: `channel-${i}`, channelTitle: `Creator ${i}`, thumbnails: {} },
}));
let container, root;
beforeEach(() => {
  localStorage.clear();
  axios.get.mockReset();
  axios.get.mockResolvedValue({ data: { items, nextPageToken: 'next' } });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const flush = async callback => act(async () => { callback(); });
const cards = () => [...container.querySelectorAll('.video-grid a.thumbnail[href^="/video/"]')];
const button = label => [...container.querySelectorAll('button')].find(b => b.textContent === label);
test('guest feed refresh, repeat search and watched updates reselect cached candidates without network calls', async () => {
  await flush(() => root.render(<MemoryRouter initialEntries={['/search/philosophy']}><Header /><Routes><Route path="/search/:searchTerm" element={<HomePage />} /></Routes></MemoryRouter>));
  expect(cards()).toHaveLength(24);
  const endpoint = new URL(axios.get.mock.calls[0][0], 'https://local.test').searchParams.get('endpoint');
  expect(endpoint).toContain('maxResults=50');
  const watched = cards()[0].getAttribute('href').split('/').pop();
  await flush(() => recordHistory(items.find(item => item.id.videoId === watched)));
  expect(cards().some(a => a.getAttribute('href') === `/video/${watched}`)).toBe(false);
  await flush(() => button('Refresh videos').click());
  expect(cards()).toHaveLength(24);
  const input = container.querySelector('input[aria-label="Search videos"]');
  await flush(() => Simulate.change(input, { target: { value: 'philosophy' } }));
  await flush(() => Simulate.submit(container.querySelector('form')));
  expect(cards()).toHaveLength(24);
  expect(axios.get).toHaveBeenCalledTimes(1);
  await flush(() => button('Explore more videos').click());
  expect(cards()).toHaveLength(48);
  expect(axios.get).toHaveBeenCalledTimes(1);
});

test('a slow previous search cannot replace the current search results', async () => {
  let finishSlow;
  axios.get.mockImplementation(url => {
    const endpoint = new URL(url, 'https://local.test').searchParams.get('endpoint');
    if (endpoint.includes('q=slow')) return new Promise(resolve => { finishSlow = resolve; });
    return Promise.resolve({ data: { items: items.map(item => ({ ...item, id: { videoId: `fast-${item.id.videoId}` } })) } });
  });
  await flush(() => root.render(<MemoryRouter initialEntries={['/search/slow']}><Header /><Routes><Route path="/search/:searchTerm" element={<HomePage />} /></Routes></MemoryRouter>));
  const input = container.querySelector('input[aria-label="Search videos"]');
  await flush(() => Simulate.change(input, { target: { value: 'fast' } }));
  await flush(() => Simulate.submit(container.querySelector('form')));
  expect(cards()).toHaveLength(24);
  expect(cards().every(a => a.getAttribute('href').startsWith('/video/fast-'))).toBe(true);
  await flush(() => finishSlow({ data: { items } }));
  expect(cards().every(a => a.getAttribute('href').startsWith('/video/fast-'))).toBe(true);
});

test('a custom topic route searches its own name rather than the For you query',async()=>{
 await flush(()=>root.render(<MemoryRouter initialEntries={['/topic/urban%20gardening']}><Routes><Route path="/topic/:topic" element={<HomePage/>}/></Routes></MemoryRouter>));
 const endpoint=new URL(axios.get.mock.calls[0][0],'http://localhost').searchParams.get('endpoint');
 expect(endpoint).toContain('q=urban%20gardening');
 expect(container.querySelector('h1').textContent).toBe('urban gardening');
});

test.each(['design%20systems','%20'])('custom topic %s is decoded exactly once',async name=>{
 await flush(()=>root.render(<MemoryRouter initialEntries={[`/topic/${encodeURIComponent(name)}`]}><Routes><Route path="/topic/:topic" element={<HomePage/>}/></Routes></MemoryRouter>));
 const endpoint=new URL(axios.get.mock.calls[0][0],'http://localhost').searchParams.get('endpoint');
 expect(endpoint).toContain('q='+encodeURIComponent(name));
 expect(container.querySelector('h1').textContent).toBe(name);
});

test('direct topic links tolerate a trailing route slash',async()=>{
 await flush(()=>root.render(<MemoryRouter initialEntries={['/topic/physics/']}><Routes><Route path="/topic/:topic" element={<HomePage/>}/></Routes></MemoryRouter>));
 expect(container.querySelector('h1').textContent).toBe('Physics');
});

test('large For you lists refresh locally until the candidate window expires',async()=>{
 const {AccountProvider}=require('../context/account-context');
 const {writeCachedFavorites}=require('../utils/account-service');
 const now=jest.spyOn(Date,'now').mockReturnValue(0);
 writeCachedFavorites(null,Array.from({length:40},(_,i)=>`Favorite subject ${i}`));
 const service={configured:false,getSession:async()=>null,subscribe:()=>()=>{}};
 try {
  await flush(()=>root.render(<AccountProvider service={service}><MemoryRouter><HomePage/></MemoryRouter></AccountProvider>));
  expect(cards()).toHaveLength(24);
  expect(axios.get).toHaveBeenCalledTimes(1);
  const first=axios.get.mock.calls[0][0];
  now.mockReturnValue(10000);
  await flush(()=>button('Refresh videos').click());
  expect(axios.get).toHaveBeenCalledTimes(1);
  now.mockReturnValue(30*60*1000+1);
  await flush(()=>button('Refresh videos').click());
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(axios.get.mock.calls[1][0]).not.toBe(first);
 } finally {now.mockRestore();}
});

test('switching search formats retains the keyword and Shorts topics retain their format', async () => {
  await flush(() => root.render(<MemoryRouter initialEntries={['/search/design']}><Header /><Routes>
    <Route path="/search/:searchTerm" element={<HomePage />} /><Route path="/topic/:topic" element={<HomePage />} />
    </Routes></MemoryRouter>));
  const switcher = container.querySelector('nav[aria-label="Content type"]');
  expect(switcher).not.toBeNull();
  await flush(() => switcher.querySelector('a[href="/search/design?format=shorts"]').click());
  const endpoint = new URL(axios.get.mock.calls.at(-1)[0], 'https://local.test').searchParams.get('endpoint');
  expect(endpoint).toContain('q=design%20%23shorts');
  expect(container.querySelector('.chips a[href^="/topic/"]').getAttribute('href')).toContain('?format=shorts');
  const input = container.querySelector('input[aria-label="Search videos"]');
  await flush(() => Simulate.change(input, { target: { value: 'craft' } }));
  await flush(() => Simulate.submit(container.querySelector('form')));
  expect(container.querySelector('nav[aria-label="Content type"] a[aria-current="page"]').textContent).toContain('Shorts');
});

test('playing a Short records history without removing it or making another search request', async () => {
  axios.get.mockResolvedValue({ data: { items: items.slice(0, 3).map(item => ({ ...item, isShort: true })) } });
  await flush(() => root.render(<MemoryRouter initialEntries={['/search/short-session?format=shorts']}><Routes>
    <Route path="/search/:searchTerm" element={<HomePage />} /></Routes></MemoryRouter>));
  expect(container.querySelectorAll('.short-card')).toHaveLength(3);
  const first = container.querySelector('.short-card').getAttribute('data-video-id');
  await flush(() => recordHistory(items.find(item => item.id.videoId === first)));
  expect(container.querySelector('.short-card').getAttribute('data-video-id')).toBe(first);
  expect(axios.get).toHaveBeenCalledTimes(1);
  await flush(() => button('Refresh Shorts').click());
  expect([...container.querySelectorAll('.short-card')].some(el => el.getAttribute('data-video-id') === first)).toBe(false);
  expect(axios.get).toHaveBeenCalledTimes(1);
});
