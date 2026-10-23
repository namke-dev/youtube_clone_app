import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import VideoDetail from './video-detail';
import { recordHistory } from '../utils/library';
jest.mock('axios');
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
