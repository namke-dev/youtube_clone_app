import { readAutoFullscreen, saveAutoFullscreen, requestVideoFullscreen } from './playback';
beforeEach(() => { localStorage.clear(); document.documentElement.classList.remove('video-fullscreen'); });
afterEach(() => jest.restoreAllMocks());
test('automatic fullscreen is opt-in and survives a reload', () => {
  expect(readAutoFullscreen()).toBe(false);
  expect(saveAutoFullscreen(true)).toBe(true);
  expect(readAutoFullscreen()).toBe(true);
  saveAutoFullscreen(false);
  expect(readAutoFullscreen()).toBe(false);
});
test('storage errors fall back to inline playback', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('disabled'); });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('disabled'); });
  expect(readAutoFullscreen()).toBe(false);
  expect(saveAutoFullscreen(true)).toBe(false);
});
test('fullscreen requests start immediately during the user gesture', async () => {
  const requestFullscreen = jest.fn().mockResolvedValue();
  const element = { requestFullscreen };
  const request = requestVideoFullscreen(element);
  expect(requestFullscreen).toHaveBeenCalledTimes(1);
  expect(await request).toBe(true);
});
test('unsupported and rejected fullscreen requests safely leave playback inline', async () => {
  expect(await requestVideoFullscreen({})).toBe(false);
  expect(await requestVideoFullscreen({ requestFullscreen: () => Promise.reject(new Error('denied')) })).toBe(false);
  expect(document.documentElement.classList.contains('video-fullscreen')).toBe(false);
});
