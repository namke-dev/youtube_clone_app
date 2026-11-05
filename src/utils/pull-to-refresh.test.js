import { installPullToRefresh } from './pull-to-refresh';

let remove, reload, changes;
const touch = (type, x, y, count = 1, target = document.body) => {
  const event = new Event(type, {bubbles:true, cancelable:true});
  Object.defineProperty(event,'touches',{value:type === 'touchend' || type === 'touchcancel' ? [] : Array.from({length:count},(_,identifier)=>({identifier,clientX:x,clientY:y}))});
  target.dispatchEvent(event);
  return event;
};
beforeEach(() => {
  window.scrollY = 0;
  reload = jest.fn();changes = [];
  remove = installPullToRefresh({isMobile:()=>true,onChange:state=>changes.push(state),reload});
});
afterEach(() => {remove();document.body.innerHTML='';document.documentElement.classList.remove('video-playback-dark');});

test('a deliberate pull at the page top reloads only after release and only once', () => {
  touch('touchstart',100,100);
  expect(touch('touchmove',100,220).defaultPrevented).toBe(true);
  expect(changes.at(-1).ready).toBe(true);
  expect(reload).not.toHaveBeenCalled();
  touch('touchend',100,220);
  touch('touchend',100,220);
  expect(reload).toHaveBeenCalledTimes(1);
  expect(changes.at(-1).loading).toBe(true);
});

test('short pulls, horizontal swipes and pulls starting below the top do not reload', () => {
  for (const [startScroll,x,y] of [[0,100,145],[0,250,220],[50,100,240]]) {
    window.scrollY=startScroll;
    touch('touchstart',100,100);touch('touchmove',x,y);touch('touchend',x,y);
  }
  expect(reload).not.toHaveBeenCalled();
});

test('multi-touch and cancellation abort an armed refresh', () => {
  for (const cancel of ['touchcancel','pinch']) {
    touch('touchstart',100,100);touch('touchmove',100,230);
    if(cancel === 'pinch') touch('touchmove',100,240,2);
    else touch('touchcancel',100,230);
    touch('touchend',100,240);
  }
  expect(reload).not.toHaveBeenCalled();
  expect(changes.at(-1).distance).toBe(0);
});

test('retreating below the threshold cancels the reload on release', () => {
  touch('touchstart',100,100);touch('touchmove',100,230);touch('touchmove',100,130);touch('touchend',100,130);
  expect(reload).not.toHaveBeenCalled();
});

test('players, Shorts scrolling, editable fields, navigation and fullscreen keep their gestures', () => {
  document.body.innerHTML='<div class="player"><span>Player</span></div><div class="shorts-feed">Shorts</div><input><nav class="bottom-nav">Navigation</nav>';
  for (const element of document.body.children) {
    touch('touchstart',100,100,1,element);expect(touch('touchmove',100,240,1,element).defaultPrevented).toBe(false);touch('touchend',100,240,1,element);
  }
  document.documentElement.classList.add('video-playback-dark');
  touch('touchstart',100,100);touch('touchmove',100,240);touch('touchend',100,240);
  expect(reload).not.toHaveBeenCalled();
});

test('desktop and detached handlers cannot trigger a reload', () => {
  remove();
  remove=installPullToRefresh({isMobile:()=>false,reload});
  touch('touchstart',100,100);touch('touchmove',100,240);touch('touchend',100,240);
  remove();
  touch('touchstart',100,100);touch('touchmove',100,240);touch('touchend',100,240);
  expect(reload).not.toHaveBeenCalled();
});
