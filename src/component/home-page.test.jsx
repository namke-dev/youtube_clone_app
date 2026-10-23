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
