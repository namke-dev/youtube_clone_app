import React from 'react';
import { createRoot } from 'react-dom/client';
import { act, Simulate } from 'react-dom/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VideoLink from './video-link';
import { saveAutoFullscreen } from '../utils/playback';

global.IS_REACT_ACT_ENVIRONMENT = true;
let container, root, requestFullscreen;
beforeEach(() => {
  localStorage.clear();
  requestFullscreen = jest.fn().mockResolvedValue();
  document.documentElement.requestFullscreen = requestFullscreen;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<MemoryRouter><VideoLink to="/video/a">Watch</VideoLink><Routes><Route path="/" element={null} /><Route path="/video/a" element={<p>Video opened</p>} /></Routes></MemoryRouter>));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete document.documentElement.requestFullscreen;
  document.documentElement.classList.remove('video-fullscreen');
});
test('an opted-in video click requests fullscreen immediately and navigates', async () => {
  saveAutoFullscreen(true);
  await act(async () => container.querySelector('a').click());
  expect(requestFullscreen).toHaveBeenCalledTimes(1);
  expect(container.textContent).toContain('Video opened');
});
test('default playback navigates without requesting fullscreen', async () => {
  await act(async () => container.querySelector('a').click());
  expect(requestFullscreen).not.toHaveBeenCalled();
  expect(container.textContent).toContain('Video opened');
});
test('modified clicks do not fullscreen the current tab', () => {
  saveAutoFullscreen(true);
  act(() => Simulate.click(container.querySelector('a'), { button: 0, ctrlKey: true }));
  expect(requestFullscreen).not.toHaveBeenCalled();
});
test('a denied fullscreen request still opens the video inline', async () => {
  saveAutoFullscreen(true);
  requestFullscreen.mockRejectedValue(new Error('denied'));
  await act(async () => container.querySelector('a').click());
  expect(container.textContent).toContain('Video opened');
  expect(document.documentElement.classList.contains('video-fullscreen')).toBe(false);
});
