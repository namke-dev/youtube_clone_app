const FULLSCREEN_KEY = "devtubes:auto-fullscreen";

export function readAutoFullscreen() {
  try {
    return localStorage.getItem(FULLSCREEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveAutoFullscreen(enabled) {
  try {
    localStorage.setItem(FULLSCREEN_KEY, String(enabled));
    return true;
  } catch {
    return false;
  }
}

export function isVideoFullscreen() {
  return Boolean(document.fullscreenElement ||
    document.documentElement.classList.contains("video-expanded"));
}

let expandedFrom = null;
function expandVideo(element) {
  if (!element?.isConnected || !element.classList) return false;
  const root = document.documentElement;
  expandedFrom = document.activeElement;
  root.classList.remove("video-fullscreen");
  root.classList.add("video-expanded");
  document.dispatchEvent(new Event("devtubes-fullscreen"));
  return true;
}

export async function exitVideoFullscreen() {
  document.documentElement.classList.remove("video-expanded", "video-fullscreen");
  document.dispatchEvent(new Event("devtubes-fullscreen"));
  if (document.fullscreenElement && document.exitFullscreen) {
    try { await document.exitFullscreen(); } catch { /* The browser may already be exiting. */ }
  }
  if (expandedFrom?.isConnected) expandedFrom.focus();
  expandedFrom = null;
}

// Call directly from a click handler: waiting for metadata loses the browser's
// transient user activation. A persistent document survives route navigation.
export async function requestVideoFullscreen(element = document.documentElement) {
  const root = document.documentElement;
  if (element === root) root.classList.add("video-fullscreen");
  if (element?.requestFullscreen) {
    try {
      await element.requestFullscreen();
      return true;
    } catch {
      // Navigation away may have cancelled this request while it was pending.
      if (element === root && !root.classList.contains("video-fullscreen")) return false;
      if (element === root) root.classList.remove("video-fullscreen");
    }
  }
  // iPhone browsers may only support native fullscreen for the video inside
  // YouTube's cross-origin iframe. Expand our player within the viewport instead.
  return expandVideo(element);
}
