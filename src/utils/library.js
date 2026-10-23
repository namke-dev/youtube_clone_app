const key = (type) => `devtubes:${type}`;
export const videoId = (video) =>
  typeof video?.id === "string" ? video.id : video?.id?.videoId;
export function readLibrary(type) {
  try {
    const data = JSON.parse(localStorage.getItem(key(type)) || "[]");
    return Array.isArray(data)
      ? data.filter((v) => videoId(v) && v.snippet).slice(0, 100)
      : [];
  } catch {
    return [];
  }
}
function write(type, items) {
  try {
    localStorage.setItem(key(type), JSON.stringify(items.slice(0, 100)));
    window.dispatchEvent(new Event("devtubes-library"));
    return true;
  } catch {
    return false;
  }
}
function add(type, video) {
  const id = videoId(video);
  if (!id || !video.snippet) return false;
  return write(type, [
    { id, snippet: video.snippet, contentDetails: video.contentDetails },
    ...readLibrary(type).filter((v) => v.id !== id),
  ]);
}
export const saveVideo = (video) => add("saved", video);
export const recordHistory = (video) => add("history", video);
export const removeVideo = (type, id) =>
  write(
    type,
    readLibrary(type).filter((v) => v.id !== id),
  );
export const clearLibrary = (type) => write(type, []);
