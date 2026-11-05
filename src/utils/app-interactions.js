// Keep ordinary scrolling/taps and editable-field selection, but suppress the
// document gestures that make this personal app zoom or select interface text.
export function installAppInteractions(target = document) {
  const cancel = event => event.preventDefault();
  const blockPinch = event => {
    if (event.touches?.length > 1) event.preventDefault();
  };
  const blockSelection = event => {
    const element = event.target?.nodeType === 3 ? event.target.parentElement : event.target;
    if (!element?.closest?.('input, textarea, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]')) {
      event.preventDefault();
    }
  };
  const handlers = [
    ['touchstart', blockPinch], ['touchmove', blockPinch],
    ['gesturestart', cancel], ['gesturechange', cancel], ['selectstart', blockSelection],
  ];
  handlers.forEach(([name, handler]) => target.addEventListener(name, handler, {passive:false}));
  return () => handlers.forEach(([name, handler]) => target.removeEventListener(name, handler));
}
