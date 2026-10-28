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

export function isMobilePlayback(device = navigator) {
  return /Android|iPhone|iPad|iPod/i.test(device.userAgent || "") ||
    (device.platform === "MacIntel" && device.maxTouchPoints > 1);
}

// Most search/video responses omit source dimensions. Use the standard wide
// YouTube view in that case; the viewer can override it with Rotate view.
export function isLandscapeVideo(video) {
  const width = Number(video?.width || video?.videoDetails?.width);
  const height = Number(video?.height || video?.videoDetails?.height);
  return !(width > 0 && height > width);
}

let orientationOwner = null;
let orientationRequest = 0;
export function setVideoLandscape(enabled) {
  document.documentElement.classList.toggle("video-landscape", enabled);
  const request = ++orientationRequest;
  if (!enabled) {
    try { orientationOwner?.unlock?.(); } catch { /* Not supported by every browser. */ }
    orientationOwner = null;
    return;
  }
  const orientation = window.screen?.orientation;
  if (!orientation?.lock) return;
  orientationOwner = orientation;
  try {
    Promise.resolve(orientation.lock("landscape")).then(() => {
      if (request !== orientationRequest && !document.documentElement.classList.contains("video-landscape")) {
        orientation.unlock?.();
      }
    }).catch(() => {
      if (request === orientationRequest) orientationOwner = null;
    });
  } catch {
    orientationOwner = null;
  }
}

export function isVideoFullscreen() {
  return Boolean(document.fullscreenElement ||
    document.documentElement.classList.contains("video-expanded"));
}

let fullscreenTheme = null;
export function setVideoFullscreenAppearance(enabled) {
  document.documentElement.classList.toggle("video-playback-dark", enabled);
  if (enabled && !fullscreenTheme) {
    const existing = document.querySelector('meta[name="theme-color"]');
    const meta = existing || document.createElement("meta");
    fullscreenTheme = { meta, existing: Boolean(existing), content: meta.getAttribute("content") };
    meta.name = "theme-color";
    meta.content = "#000000";
    if (!existing) document.head.appendChild(meta);
  } else if (!enabled && fullscreenTheme) {
    const { meta, existing, content } = fullscreenTheme;
    if (!existing) meta.remove();
    else if (content === null) meta.removeAttribute("content");
    else meta.setAttribute("content", content);
    fullscreenTheme = null;
  }
}

let expandedFrom = null;
let fullscreenRequest = 0;
function expandVideo(element) {
  if (!element?.isConnected || !element.classList) return false;
  const root = document.documentElement;
  expandedFrom = document.activeElement;
  root.classList.remove("video-fullscreen");
  root.classList.add("video-expanded");
  setVideoFullscreenAppearance(true);
  document.dispatchEvent(new Event("devtubes-fullscreen"));
  return true;
}

export async function exitVideoFullscreen() {
  fullscreenRequest++;
  setVideoLandscape(false);
  document.documentElement.classList.remove("video-expanded", "video-fullscreen");
  setVideoFullscreenAppearance(false);
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
  const request = ++fullscreenRequest;
  const root = document.documentElement;
  if (element === root) root.classList.add("video-fullscreen");
  if (element?.requestFullscreen) {
    try {
      await element.requestFullscreen();
      if (request !== fullscreenRequest) return false;
      setVideoFullscreenAppearance(true);
      return true;
    } catch {
      // Navigation away may have cancelled this request while it was pending.
      if (request !== fullscreenRequest || (element === root && !root.classList.contains("video-fullscreen"))) return false;
      if (element === root) root.classList.remove("video-fullscreen");
    }
  }
  // iPhone browsers may only support native fullscreen for the video inside
  // YouTube's cross-origin iframe. Expand our player within the viewport instead.
  return expandVideo(element);
}
