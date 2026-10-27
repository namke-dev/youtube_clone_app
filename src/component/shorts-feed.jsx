import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactPlayer from "react-player/youtube";
import { Link } from "react-router-dom";
import { Icon, Thumbnail } from "./ui";
import { readLibrary, recordHistory, removeVideo, saveVideo, videoId } from "../utils/library";
import { useAccount } from "../context/account-context";

function ShortPlayer({ video, muted, onMute }) {
  const { loading } = useAccount();
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(() => readLibrary("saved").some(item => item.id === videoId(video)));
  const recorded = useRef(false);
  useEffect(() => {
    const visibility = () => setVisible(!document.hidden);
    const library = () => setSaved(readLibrary("saved").some(item => item.id === videoId(video)));
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("devtubes-library", library);
    window.addEventListener("storage", library);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("devtubes-library", library);
      window.removeEventListener("storage", library);
    };
  }, [video]);
  return <>
    <div className="short-player">
      <ReactPlayer url={`https://www.youtube.com/watch?v=${videoId(video)}`}
        width="100%" height="100%" playing={!paused && visible} muted={muted}
        controls playsinline loop config={{ youtube: { playerVars: { playsinline: 1, rel: 0 } } }}
        onPlay={() => {
          setPaused(false);
          if (!loading && !recorded.current) { recorded.current = true; recordHistory(video); }
        }} onPause={() => { if (!document.hidden) setPaused(true); }} onError={() => setFailed(true)} />
    </div>
    <div className="short-actions">
      <button className="button" onClick={() => setPaused(value => !value)} aria-label={paused ? "Play Short" : "Pause Short"}>{paused ? "Play" : "Pause"}</button>
      <button className="button" onClick={onMute} aria-label={muted ? "Turn sound on" : "Mute Short"}>{muted ? "Sound on" : "Mute"}</button>
      <button className="button" disabled={loading} aria-label={saved ? "Unsave Short" : "Save Short"} aria-pressed={saved}
        onClick={() => saved ? removeVideo("saved", videoId(video)) : saveVideo(video)}>
        <Icon name="saved" />{saved ? "Saved" : "Save"}
      </button>
    </div>
    {failed && <p role="alert">This Short cannot play here. <a href={`https://www.youtube.com/shorts/${videoId(video)}`} target="_blank" rel="noreferrer">Watch on YouTube</a></p>}
  </>;
}

export default function ShortsFeed({ videos, hasMore = false, more = false, onLoadMore }) {
  const feed = useRef(null);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const lastScroll = useRef(0);
  const lastBoundary = useRef(0);
  useLayoutEffect(() => {
    if (!feed.current?.clientHeight) return;
    // Appending above the end panel must not let scroll anchoring skip the new
    // Shorts or trigger a chain of page requests.
    feed.current.scrollTop = lastScroll.current;
    setActive(Math.min(videos.length, Math.round(lastScroll.current / feed.current.clientHeight)));
  }, [videos.length]);
  const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  function goTo(index) {
    feed.current?.scrollTo({ top: index * feed.current.clientHeight, behavior: reduceMotion() ? "auto" : "smooth" });
  }
  function scroll() {
    const element = feed.current;
    if (!element.clientHeight) return;
    const index = Math.min(videos.length, Math.max(0, Math.round(element.scrollTop / element.clientHeight)));
    setActive(index);
    // Only a downward user scroll near the end may paginate. Never cascade
    // requests from mounting, playback events, or a page with no eligible items.
    if (element.scrollTop > lastScroll.current && index >= videos.length - 2 && hasMore && !more && lastBoundary.current !== videos.length) {
      lastBoundary.current = videos.length;
      onLoadMore?.();
    }
    lastScroll.current = element.scrollTop;
  }
  return <section className="shorts-feed" ref={feed} onScroll={scroll} tabIndex={0}
    aria-label="Shorts feed" onKeyDown={event => {
      if (event.target !== event.currentTarget || !["ArrowDown", "ArrowUp"].includes(event.key)) return;
      event.preventDefault();
      goTo(Math.max(0, Math.min(videos.length, active + (event.key === "ArrowDown" ? 1 : -1))));
    }}>
    {videos.map((video, index) => <article className="short-card" key={videoId(video)}
      data-video-id={videoId(video)} data-active={index === active} aria-label={video.snippet.title}>
      <div className="short-content">
        <div className="short-stage">
          <div className="short-media">
            {index === active ? <ShortPlayer key={videoId(video)} video={video} muted={muted} onMute={() => setMuted(value => !value)} />
              : <div className="short-poster"><Thumbnail item={video} /></div>}
          </div>
          <div className="short-scroll-rail">
            <button className="button" aria-label="Previous Short" disabled={index === 0} onClick={() => goTo(index - 1)}>↑</button>
            <span>Swipe ↑</span>
            <button className="button" aria-label="Next Short" disabled={index === videos.length - 1} onClick={() => goTo(index + 1)}>↓</button>
          </div>
        </div>
        <div className="short-caption">
          <h2>{video.snippet.title}</h2>
          {video.snippet.channelId ? <Link to={`/channel/${video.snippet.channelId}`}>{video.snippet.channelTitle}</Link> : <p>{video.snippet.channelTitle}</p>}
        </div>
      </div>
    </article>)}
    <div className="shorts-end">
      {hasMore ? <button className="button" onClick={onLoadMore} disabled={more}>{more ? "Loading…" : "Find more Shorts"}</button>
        : <p>You’re all caught up. Pick another topic or refresh.</p>}
    </div>
  </section>;
}
