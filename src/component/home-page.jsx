import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { discovery } from "../utils/discovery";
import { readLibrary, videoId } from "../utils/library";
import { topics, Icon, Status } from "./ui";
import SideBar from "./side-bar";
import Videos from "./videos";
import ShortsFeed from "./shorts-feed";
import { useAccount } from "../context/account-context";
import { favoriteTopicBar, forYouQuery, interestScore, topicFromName } from "../utils/personalization";
export default function HomePage() {
  const { searchTerm, topic } = useParams();
  const location = useLocation();
  const account = useAccount();
  const shorts = location.pathname === "/shorts" || new URLSearchParams(location.search).get("format") === "shorts";
  const format = shorts ? "shorts" : "videos";
  let topicName = topic;
  if (topic) {
    // Read the encoded path directly: this router version decodes % sequences
    // twice in params, which changes custom names such as "Design%20systems".
    try { topicName = decodeURIComponent(location.pathname.slice('/topic/'.length).replace(/\/+$/, '')); }
    catch { topicName = topic; }
  }
  const selected = topic ? topicFromName(account.favorites.find(name => name.toLowerCase() === topicName.toLowerCase()) || topicName) : topics[0];
  const [queryTime, setQueryTime] = useState(Date.now);
  const isForYou = !searchTerm && selected.name === topics[0].name;
  const query = searchTerm || (isForYou ? forYouQuery(account.favorites, topics, queryTime) : selected.query);
  const favoriteKey = JSON.stringify(account.favorites);
  const userId = account.user?.id || null;
  const visibleTopics = favoriteTopicBar(account.favorites, topics, topic ? selected.name : undefined);
  const [videos, setVideos] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const busy = useRef(false);
  const includeChannels = Boolean(searchTerm) && !shorts;
  const historyKey = () => JSON.stringify(readLibrary("history").map(videoId));
  const [history, setHistory] = useState(historyKey);
  // Recording playback must not reshuffle the Short that is currently playing.
  const watchedHistory = shorts ? null : history;
  useEffect(() => {
    const changed = () => setHistory(historyKey());
    window.addEventListener("devtubes-library", changed);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener("devtubes-library", changed);
      window.removeEventListener("storage", changed);
    };
  }, []);
  useEffect(() => {
    const current = ++generation.current;
    busy.current = false;
    setMore(false);
    setLoading(true);
    setVideos([]);
    setHasMore(false);
    setError(null);
    if (account.loading) return () => { generation.current = current + 1; };
    const personalInterest = isForYou
      ? item => interestScore(item, JSON.parse(favoriteKey), readLibrary("history"))
      : () => 0;
    discovery.discover(query, { format, includeChannels, watchedIds: new Set(watchedHistory ? JSON.parse(watchedHistory) : readLibrary("history").map(videoId)), personalInterest })
      .then((data) => {
        if (current === generation.current) {
          setVideos(data.items);
          setHasMore(data.hasMore);
        }
      })
      .catch((e) => {
        if (current === generation.current) setError(e.message);
      })
      .finally(() => {
        if (current === generation.current) setLoading(false);
      });
    return () => { generation.current = current + 1; };
  }, [query, includeChannels, attempt, location.key, watchedHistory, format, account.loading, favoriteKey, userId, isForYou]);
  function refresh() {
    const now = Date.now();
    if (now - queryTime >= 30 * 60 * 1000) setQueryTime(now);
    setAttempt(n => n + 1);
  }
  async function loadMore() {
    if (busy.current || !hasMore) return;
    busy.current = true;
    const current = generation.current;
    setMore(true);
    setError(null);
    try {
      const data = await discovery.discover(query, {
        includeChannels, format,
        watchedIds: new Set(readLibrary("history").map(videoId)),
        loadMore: true,
        previous: videos,
        personalInterest: isForYou ? item => interestScore(item, account.favorites, readLibrary("history")) : () => 0,
      });
      if (current !== generation.current) return;
      setVideos(data.items);
      setHasMore(data.hasMore);
    } catch (e) {
      if (current === generation.current) setError(e.message);
    } finally {
      if (current === generation.current) {
        busy.current = false;
        setMore(false);
      }
    }
  }
  const explore = !shorts && !searchTerm && !topic;
  const videoPath = location.pathname === "/shorts" ? "/explore" : location.pathname;
  const shortsPath = ["/", "/explore", "/shorts"].includes(location.pathname) ? "/shorts" : `${location.pathname}?format=shorts`;
  return (
    <div className="app-layout">
      <SideBar />
      <main id="main" className={`feed ${shorts ? "shorts-page" : ""}`}>
        <div className="intro">
          <div>
            <h1>
              {searchTerm
                ? `Results for “${searchTerm}”`
                : topic
                  ? selected.name
                  : shorts
                    ? "Shorts"
                    : "Explore"}
            </h1>
            <p>{searchTerm ? 'Videos and creators matching your search.' : shorts ? 'A quick change of perspective.' : topic ? 'Ideas, stories and perspectives to go deeper.' : 'Follow an interest. Or find a new one.'}</p>
          </div>
        </div>
        {explore && <nav className="topic-shelf" aria-label="Explore a wider world">
          {[
            ['AI', 'AI & technology', 'Developments, ideas and useful explanations.'],
            ['Landscapes', 'Places & landscapes', 'Geography, nature and the shape of the world.'],
            ['Culture & Food', 'Culture & food', 'How people live, cook and see things differently.'],
            ['World & Science', 'World & science', 'Discoveries and the forces changing our planet.'],
          ].map(([name, title, description]) => <Link key={name} to={`/topic/${encodeURIComponent(name.toLowerCase())}`}>
            <h2>{title}</h2><p>{description}</p><Icon name="arrow" />
          </Link>)}
        </nav>}
        <nav className="content-types" aria-label="Content type">
          <Link to={videoPath} aria-current={!shorts ? "page" : undefined}>Videos</Link>
          <Link to={shortsPath} aria-current={shorts ? "page" : undefined}>Shorts</Link>
        </nav>
        <nav className="chips" aria-label="Video topics">
          {visibleTopics.map((t) => (
            <Link key={t.name}
              className={`chip ${!searchTerm && selected.name === t.name ? "selected" : ""}`}
              to={t.name === "For you" ? (shorts ? "/shorts" : "/") : `/topic/${encodeURIComponent(t.name.toLowerCase())}${shorts ? "?format=shorts" : ""}`}
              aria-current={!searchTerm && selected.name === t.name ? "page" : undefined}
            >
              {t.name}
            </Link>
          ))}
        </nav>
        <div className="section-heading">
          <h2>
            {shorts ? "Scroll to discover." : searchTerm
              ? "Search results"
              : selected.name === "For you"
                  ? "From your interests"
                  : `${selected.name}, in focus`}
          </h2>
          <button className="button" onClick={refresh} disabled={loading || more} aria-label={shorts ? "Refresh Shorts" : undefined} title={shorts ? "Refresh Shorts" : undefined}>
            {shorts && <Icon className="short-refresh-icon" name="refresh" />}<span>{shorts ? "Refresh Shorts" : "Refresh videos"}</span>
          </button>
        </div>
        <Status
          loading={loading}
          error={!videos.length && error}
          retry={refresh}
          empty={!loading && !error && !videos.length}
        />
        {shorts && videos.length > 0
          ? <ShortsFeed key={`${query}:${attempt}:${userId}:${favoriteKey}`} videos={videos} hasMore={hasMore} more={more} onLoadMore={loadMore} />
          : <Videos videos={videos} />}
        {videos.length > 0 && error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
        {hasMore && (!shorts || !videos.length) && (
          <div className="load-more">
            <button className="button" onClick={loadMore} disabled={more}>
              {more ? "Loading…" : shorts ? "Find more Shorts" : "Explore more videos"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
