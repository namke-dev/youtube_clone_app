const THRESHOLD = 96;
const empty = {distance:0, ready:false, loading:false};

export function installPullToRefresh({
  isMobile = () => window.matchMedia?.('(pointer: coarse), (max-width: 850px)')?.matches || false,
  onChange = () => {},
  reload = () => window.location.reload(),
} = {}) {
  let gesture = null;
  let loading = false;
  const atTop = () => window.scrollY <= 0 && (document.scrollingElement || document.documentElement).scrollTop <= 0;
  const fullscreen = () => document.fullscreenElement || document.documentElement.classList.contains('video-playback-dark');
  function excluded(target) {
    const element = target?.nodeType === 3 ? target.parentElement : target;
    if (element?.closest?.('input, textarea, select, button, [contenteditable], iframe, video, .player, .shorts-feed, .chips, .bottom-nav')) return true;
    // A nested scroller owns its own swipe, even when its first row is visible.
    for (let node = element; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      if (node.scrollHeight > node.clientHeight && /auto|scroll/.test(window.getComputedStyle(node).overflowY)) return true;
    }
    return false;
  }
  function cancel() {
    if (!gesture) return;
    gesture = null;
    onChange(empty);
  }
  function start(event) {
    cancel();
    if (loading || !isMobile() || event.touches.length !== 1 || !atTop() || fullscreen() || excluded(event.target)) return;
    const touch = event.touches[0];
    gesture = {x:touch.clientX, y:touch.clientY, id:touch.identifier, distance:0};
  }
  function move(event) {
    if (!gesture) return;
    if (event.touches.length !== 1 || !atTop() || fullscreen()) return cancel();
    const touch = event.touches[0];
    if (touch.identifier !== gesture.id) return cancel();
    const dy = touch.clientY - gesture.y;
    const dx = Math.abs(touch.clientX - gesture.x);
    if (dy < -8 || (dx > 12 && dx > Math.abs(dy))) return cancel();
    if (dy > 12 && dy > dx * 1.2) {
      if (!event.cancelable) return cancel();
      event.preventDefault();
      gesture.distance = Math.min(dy,160);
    } else {
      gesture.distance = 0;
    }
    onChange({distance:gesture.distance, ready:gesture.distance >= THRESHOLD, loading:false});
  }
  function end(event) {
    if (!gesture) return;
    if (event.touches.length || gesture.distance < THRESHOLD || !atTop() || fullscreen()) return cancel();
    gesture = null;
    loading = true;
    onChange({distance:THRESHOLD, ready:true, loading:true});
    reload();
  }
  const handlers = [['touchstart',start],['touchmove',move],['touchend',end],['touchcancel',cancel]];
  handlers.forEach(([name,handler]) => document.addEventListener(name,handler,{passive:name !== 'touchmove'}));
  return () => handlers.forEach(([name,handler]) => document.removeEventListener(name,handler));
}
