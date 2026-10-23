import axios from "axios";
const cache = new Map();
const pending = new Map();
const TTL = 5 * 60 * 1000;
export async function fetchFromApi(endpoint) {
  const cached = cache.get(endpoint);
  if (cached && cached.expires > Date.now()) return cached.data;
  if (pending.has(endpoint)) return pending.get(endpoint);
  const request = axios
    .get(`/api/youtube?endpoint=${encodeURIComponent(endpoint)}`, {
      timeout: 15000,
    })
    .then(({ data }) => {
      if (!Array.isArray(data?.items))
        throw new Error(
          "The video service returned an unexpected response. Please try again.",
        );
      if (cache.size >= 80) cache.delete(cache.keys().next().value);
      cache.set(endpoint, { data, expires: Date.now() + (endpoint.startsWith("search?") ? 30 * 60 * 1000 : TTL) });
      return data;
    })
    .catch((error) => {
      const status = error.response?.status;
      const message =
        status === 429
          ? "The video service has reached its request limit. Please try again later."
          : status === 503
            ? "The video service is not configured yet. Please try again later."
            : status === 403 || status === 401
              ? "The video service is unavailable. Its API subscription may need attention."
              : "Could not load videos. Check your connection and try again.";
      throw new Error(message);
    })
    .finally(() => pending.delete(endpoint));
  pending.set(endpoint, request);
  return request;
}
