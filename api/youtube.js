// Credentials stay in the Vercel function, never in the browser bundle.
const ENDPOINTS = new Set(["search", "videos", "channels", "commentThreads"]);
const PARAMS = new Set([
  "part",
  "q",
  "id",
  "channelId",
  "videoId",
  "relatedToVideoId",
  "maxResults",
  "order",
  "pageToken",
  "type",
  "regionCode",
]);
module.exports = async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  const raw = req.query.endpoint;
  if (typeof raw !== "string" || raw.length > 2000)
    return res.status(400).json({ error: "Invalid request" });
  const [path, query = ""] = raw.split("?");
  if (!ENDPOINTS.has(path))
    return res.status(400).json({ error: "Unsupported endpoint" });
  const params = new URLSearchParams(query);
  if ([...params.keys()].some((key) => !PARAMS.has(key)))
    return res.status(400).json({ error: "Unsupported parameter" });
  if (params.has("maxResults")) {
    const count = Number(params.get("maxResults"));
    if (!Number.isInteger(count) || count < 1 || count > 50)
      return res.status(400).json({ error: "Invalid result count" });
  }
  const key = process.env.RAPIDAPI_KEY || process.env.REACT_APP_API_KEY;
  if (!key)
    return res.status(503).json({ error: "Video service is not configured" });
  try {
    const response = await fetch(
      `https://youtube-v31.p.rapidapi.com/${path}?${params}`,
      {
        headers: {
          "X-RapidAPI-Key": key,
          "X-RapidAPI-Host": "youtube-v31.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok)
      return res
        .status(
          [401, 403, 429].includes(response.status) ? response.status : 502,
        )
        .json({ error: "Video provider unavailable" });
    const data = await response.json();
    if (!Array.isArray(data?.items))
      return res.status(502).json({ error: "Invalid provider response" });
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=60",
    );
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: "Video provider unavailable" });
  }
};
