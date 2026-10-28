import { readAutoFullscreen, saveAutoFullscreen, requestVideoFullscreen, exitVideoFullscreen, isVideoFullscreen } from './playback';
beforeEach(() => { localStorage.clear(); document.documentElement.classList.remove('video-fullscreen'); });
afterEach(async () => { await exitVideoFullscreen(); jest.restoreAllMocks(); });
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
test('invalid fullscreen targets fail safely', async () => {
  expect(await requestVideoFullscreen({})).toBe(false);
  expect(await requestVideoFullscreen({ requestFullscreen: () => Promise.reject(new Error('denied')) })).toBe(false);
  expect(document.documentElement.classList.contains('video-fullscreen')).toBe(false);
});


test.each(['unsupported', 'rejected'])('expands the available viewport when browser fullscreen is %s', async mode => {
  const element = document.createElement('div');
  if (mode === 'rejected') element.requestFullscreen = jest.fn().mockRejectedValue(new Error('denied'));
  document.body.appendChild(element);
  try {
    expect(await requestVideoFullscreen(element)).toBe(true);
    expect(document.documentElement.classList.contains('video-expanded')).toBe(true);
    expect(isVideoFullscreen()).toBe(true);
    await exitVideoFullscreen();
    expect(isVideoFullscreen()).toBe(false);
    expect(document.documentElement.classList.contains('video-expanded')).toBe(false);
  } finally {
    element.remove();
  }
});

test('mobile playback includes iPhone, Android and iPad desktop-mode, without changing desktop playback', () => {
  const { isMobilePlayback } = require('./playback');
  expect(isMobilePlayback({ userAgent: 'Mozilla iPhone', platform: 'iPhone', maxTouchPoints: 5 })).toBe(true);
  expect(isMobilePlayback({ userAgent: 'Mozilla Android', maxTouchPoints: 5 })).toBe(true);
  expect(isMobilePlayback({ userAgent: 'Mozilla Macintosh', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
  expect(isMobilePlayback({ userAgent: 'Mozilla Macintosh', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
});
test('landscape view requests orientation when available and releases it on exit', async () => {
  const { setVideoLandscape } = require('./playback');
  const lock = jest.fn().mockResolvedValue();
  const unlock = jest.fn();
  const original = Object.getOwnPropertyDescriptor(window.screen, 'orientation');
  Object.defineProperty(window.screen, 'orientation', { configurable: true, value: { lock, unlock } });
  try {
    setVideoLandscape(true);
    expect(document.documentElement.classList.contains('video-landscape')).toBe(true);
    expect(lock).toHaveBeenCalledWith('landscape');
    await exitVideoFullscreen();
    expect(unlock).toHaveBeenCalled();
    expect(document.documentElement.classList.contains('video-landscape')).toBe(false);
  } finally {
    if (original) Object.defineProperty(window.screen, 'orientation', original);
    else delete window.screen.orientation;
  }
});
test('unsupported orientation lock keeps the landscape view without throwing', () => {
  const { setVideoLandscape } = require('./playback');
  setVideoLandscape(true);
  expect(document.documentElement.classList.contains('video-landscape')).toBe(true);
  setVideoLandscape(false);
});


test('known portrait source dimensions do not select the landscape view', () => {
  const { isLandscapeVideo } = require('./playback');
  expect(isLandscapeVideo({ width: 1080, height: 1920 })).toBe(false);
  expect(isLandscapeVideo({ width: 1920, height: 1080 })).toBe(true);
  expect(isLandscapeVideo({})).toBe(true);
});

test('denied orientation lock still keeps landscape viewing available', async () => {
  const { setVideoLandscape } = require('./playback');
  const original = Object.getOwnPropertyDescriptor(window.screen, 'orientation');
  Object.defineProperty(window.screen, 'orientation', { configurable: true, value: { lock: jest.fn().mockRejectedValue(new Error('unsupported')), unlock: jest.fn() } });
  try {
    setVideoLandscape(true);
    await Promise.resolve();
    expect(document.documentElement.classList.contains('video-landscape')).toBe(true);
  } finally {
    setVideoLandscape(false);
    if (original) Object.defineProperty(window.screen, 'orientation', original);
    else delete window.screen.orientation;
  }
});

test('fullscreen requests a black browser theme and restores it on exit', async () => {
  const meta=document.createElement('meta');meta.name='theme-color';meta.content='#fbfbfd';document.head.appendChild(meta);
  const element=document.createElement('div');document.body.appendChild(element);
  try {
    await requestVideoFullscreen(element);
    expect(meta.content).toBe('#000000');
    expect(document.documentElement.classList.contains('video-playback-dark')).toBe(true);
    await exitVideoFullscreen();
    expect(meta.content).toBe('#fbfbfd');
    expect(document.documentElement.classList.contains('video-playback-dark')).toBe(false);
  } finally {await exitVideoFullscreen();element.remove();meta.remove();}
});

test('a native fullscreen request finishing after cancellation cannot restore the black theme', async () => {
  let finish;
  document.documentElement.requestFullscreen=jest.fn(()=>new Promise(resolve=>{finish=resolve;}));
  try {
    const request=requestVideoFullscreen();
    await exitVideoFullscreen();
    finish();
    expect(await request).toBe(false);
    expect(document.documentElement.classList.contains('video-playback-dark')).toBe(false);
  } finally {delete document.documentElement.requestFullscreen;}
});
