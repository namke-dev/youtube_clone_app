import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useResource, Status, Thumbnail } from "./ui";
import Videos from "./videos";
import { fetchFromApi } from "../utils/fetchFromApi";
import { videoId } from "../utils/library";
export default function ChannelDetail() {
  const { id } = useParams();
  return <ChannelContent key={id} id={id} />;
}
function ChannelContent({ id }) {
  const state = useResource(
    `channels?part=snippet&id=${encodeURIComponent(id)}`,
  );
  const endpoint = `search?channelId=${encodeURIComponent(id)}&part=snippet&type=video&order=date&maxResults=24`;
  const feed = useResource(endpoint);
  const [extra, setExtra] = useState([]);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setExtra([]);
    setToken(feed.data?.nextPageToken || "");
    setError("");
  }, [feed.data]);
  const channel = state.data?.items[0];
  async function more() {
    setBusy(true);
    setError("");
    try {
      const data = await fetchFromApi(
        `${endpoint}&pageToken=${encodeURIComponent(token)}`,
      );
      setExtra((old) => {
        const seen = new Set(
          [...(feed.data?.items || []), ...old].map(videoId),
        );
        return [
          ...old,
          ...data.items.filter((v) => {
            const key = videoId(v);
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          }),
        ];
      });
      setToken(data.nextPageToken === token ? "" : data.nextPageToken || "");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="channel-page">
      <Link className="text-link" to="/">
        ← Discover
      </Link>
      <Status {...state} />
      {channel && (
        <section className="channel-heading">
          <Thumbnail item={channel} />
          <div>
            <span className="eyebrow">CREATOR CHANNEL</span>
            <h1>{channel.snippet?.title}</h1>
            <p>{channel.snippet?.description}</p>
          </div>
        </section>
      )}
      <h2>Latest videos</h2>
      <Status
        {...feed}
        empty={!feed.loading && !feed.error && !feed.data?.items.length}
      />
      <Videos videos={[...(feed.data?.items || []), ...extra]} />
      {error && <p role="alert">{error}</p>}
      {token && (
        <div className="load-more">
          <button className="button" disabled={busy} onClick={more}>
            {busy ? "Loading…" : "Load more videos"}
          </button>
        </div>
      )}
    </main>
  );
}
