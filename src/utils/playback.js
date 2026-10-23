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

// Call directly from a click handler: waiting for metadata loses the browser's
// transient user activation. A persistent document survives route navigation.
export async function requestVideoFullscreen(element = document.documentElement) {
  if (!element?.requestFullscreen) return false;
  const root = document.documentElement;
  if (element === root) root.classList.add("video-fullscreen");
  try {
    await element.requestFullscreen();
    return true;
  } catch {
    if (element === root) root.classList.remove("video-fullscreen");
    return false;
  }
}
