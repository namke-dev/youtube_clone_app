import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { fetchFromApi } from "../utils/fetchFromApi";
import { videoId } from "../utils/library";
import { topics, Icon, Status, Thumbnail } from "./ui";
import SideBar from "./side-bar";
import Videos from "./videos";
export default function HomePage() {
  const { searchTerm, topic } = useParams();
  const location = useLocation();
  const selected =
    topics.find((t) => t.name.toLowerCase() === topic) || topics[0];
  const query = searchTerm || selected.query;
  const [videos, setVideos] = useState([]);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const busy = useRef(false);
  const resultKey = (item) =>
    item.id?.channelId ? `channel:${item.id.channelId}` : videoId(item);
  const endpoint = `search?part=snippet,id&type=${searchTerm ? "video,channel" : "video"}&maxResults=24&q=${encodeURIComponent(query)}`;
  useEffect(() => {
    const current = ++generation.current;
    busy.current = false;
    setMore(false);
    setLoading(true);
    setVideos([]);
    setToken("");
    setError(null);
    fetchFromApi(endpoint)
      .then((data) => {
        if (current === generation.current) {
          setVideos(data.items);
          setToken(data.nextPageToken || "");
        }
      })
      .catch((e) => {
        if (current === generation.current) setError(e.message);
      })
      .finally(() => {
        if (current === generation.current) setLoading(false);
      });
    return () => {
      generation.current = current + 1;
    };
  }, [endpoint, attempt]);
  async function loadMore() {
    if (busy.current || !token) return;
    busy.current = true;
    const current = generation.current;
    setMore(true);
    setError(null);
    try {
      const data = await fetchFromApi(
        `${endpoint}&pageToken=${encodeURIComponent(token)}`,
      );
      if (current !== generation.current) return;
      setVideos((old) => {
        const seen = new Set(old.map(resultKey));
        return [
          ...old,
          ...data.items.filter((v) => {
            const id = resultKey(v);
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
          }),
        ];
      });
      setToken(
        data.nextPageToken && data.nextPageToken !== token
          ? data.nextPageToken
          : "",
      );
    } catch (e) {
      if (current === generation.current) setError(e.message);
    } finally {
      if (current === generation.current) {
        busy.current = false;
        setMore(false);
      }
    }
  }
  const home = !searchTerm && !topic && location.pathname === "/";
  const featured = videos.find(videoId);
  return (
    <div className="app-layout">
      <SideBar />
      <main id="main" className="feed">
        <div className="intro">
          <div>
            <h1 className={home ? "desktop-title" : ""}>
              {searchTerm
                ? `Results for “${searchTerm}”`
                : topic
                  ? selected.name
                  : home
                    ? "Find your next rabbit hole."
                    : "Made for curious minds."}
            </h1>
            {home && (
              <h1 className="mobile-title">
                A little less noise.
                <br />A lot more wonder.
              </h1>
            )}
            <p>Extraordinary stories. Room to explore.</p>
          </div>
          <span className="eyebrow">
            {searchTerm ? "SEARCH" : "DISCOVER SOMETHING NEW"}
          </span>
        </div>
        <nav className="chips" aria-label="Video topics">
          {topics.map((t) => (
            <Link
              className={`chip ${!searchTerm && selected.name === t.name ? "selected" : ""}`}
              to={t.name === "For you" ? "/" : `/topic/${t.name.toLowerCase()}`}
              key={t.name}
            >
              {t.name}
            </Link>
          ))}
        </nav>
        {home && featured && (
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow">THE DISCOVERY EDIT</span>
              <h2>
                Go somewhere
                <br />
                you’ve never been.
              </h2>
              <p>A slower perspective on a world in motion.</p>
              <Link className="button light" to={`/video/${videoId(featured)}`}>
                <Icon name="play" />
                Watch video
              </Link>
            </div>
            <Link
              className="hero-art"
              to={`/video/${videoId(featured)}`}
              aria-label={`Watch ${featured.snippet?.title}`}
            >
              <Thumbnail item={featured} />
              <span className="hero-caption">{featured.snippet?.title}</span>
            </Link>
          </section>
        )}
        <div className="section-heading">
          <h2>
            {searchTerm
              ? "Search results"
              : home
                ? "Worth your time"
                : selected.name === "For you"
                  ? "Explore videos"
                  : `${selected.name}, in focus`}
          </h2>
          <p>{!searchTerm && "A fresh perspective, every day."}</p>
        </div>
        <Status
          loading={loading}
          error={!videos.length && error}
          retry={() => setAttempt((n) => n + 1)}
          empty={!loading && !error && !videos.length}
        />
        <Videos videos={videos} />
        {videos.length > 0 && error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
        {token && (
          <div className="load-more">
            <button className="button" onClick={loadMore} disabled={more}>
              {more ? "Loading…" : "Explore more videos"}
            </button>
          </div>
        )}
        {home && (
          <div className="section-heading ending">
            <h2>Made for curious minds</h2>
            <Link to="/explore">
              Explore all topics <Icon name="arrow" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
