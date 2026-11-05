import { installAppInteractions } from './app-interactions';

let remove;
beforeEach(() => { remove = installAppInteractions(document); });
afterEach(() => { remove(); document.body.innerHTML = ''; });

function touch(type, count) {
  const event = new Event(type, {bubbles:true, cancelable:true});
  Object.defineProperty(event, 'touches', {value:Array.from({length:count}, () => ({}))});
  document.body.dispatchEvent(event);
  return event.defaultPrevented;
}

test('pinch gestures are cancelled while a single finger can still scroll and tap', () => {
  expect(touch('touchstart',1)).toBe(false);
  expect(touch('touchmove',1)).toBe(false);
  expect(touch('touchstart',2)).toBe(true);
  expect(touch('touchmove',2)).toBe(true);
  for (const type of ['gesturestart','gesturechange']) {
    const event = new Event(type, {bubbles:true,cancelable:true});
    document.body.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  }
});

test('interface text cannot be selected but search and editable fields remain editable', () => {
  document.body.innerHTML = '<p>Story title</p><input value="Search text"><textarea>Note</textarea><div contenteditable="true"><span>Edit me</span></div>';
  for (const [selector, blocked] of [['p',true],['input',false],['textarea',false],['span',false]]) {
    const event = new Event('selectstart',{bubbles:true,cancelable:true});
    document.querySelector(selector).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(blocked);
  }
});

test('removing the handlers restores the default gesture behavior', () => {
  remove();
  expect(touch('touchstart',2)).toBe(false);
});
