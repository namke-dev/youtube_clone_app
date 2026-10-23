// Search snippets do not reliably expose duration, orientation or Shorts status.
// Use explicit signals only; a brief normal video is not necessarily a Short.
export function isShort(item) {
  if (item?.id?.channelId || item?.kind === "youtube#channel") return false;
  if (item?.isShort === true || item?.isShorts === true ||
      item?.snippet?.isShort === true || item?.type === "shorts") return true;
  const urls = [item?.url, item?.link, item?.shortsUrl];
  if (urls.some(url => typeof url === "string" && /(?:youtube\.com|youtu\.be)\/shorts\//i.test(url))) return true;
  const text = `${item?.snippet?.title || ""} ${item?.snippet?.description || ""}`;
  return /(?:^|\s|[([{])#shorts?\b/i.test(text);
}
