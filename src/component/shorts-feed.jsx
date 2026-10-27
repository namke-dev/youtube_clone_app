import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactPlayer from "react-player/youtube";
import { Link } from "react-router-dom";
import { Icon, Thumbnail } from "./ui";
import { readLibrary, recordHistory, removeVideo, saveVideo, videoId } from "../utils/library";
import { useAccount } from "../context/account-context";

let autoplayListenerId = 0;
function ShortPlayer({ video, enabled, muted, onSoundChange }) {
  const { loading } = useAccount();
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(() => readLibrary("saved").some(item => item.id === videoId(video)));
  const recorded = useRef(false);
  const player = useRef(null);
  const autoplayCleanup = useRef(null);
  const [blocked, setBlocked] = useState(false);
  const id = videoId(video);
  useLayoutEffect(() => {
    recorded.current = false;
    setPaused(false);
    setFailed(false);
    setBlocked(false);
    setSaved(readLibrary("saved").some(item => item.id === id));
  }, [id]);
  useEffect(() => () => autoplayCleanup.current?.(), []);
  useLayoutEffect(() => {
    if (!enabled || !visible) player.current?.pauseVideo?.();
  }, [enabled, visible]);
  function matchesVideo() {
    const actual = player.current?.getVideoData?.()?.video_id;
    return !actual || actual === id;
  }
  function ready(instance) {
    autoplayCleanup.current?.();
    const internal = instance.getInternalPlayer();
    player.current = internal;
    const listener = `__devtubesShortsAutoplayBlocked${++autoplayListenerId}`;
    window[listener] = () => { if (matchesVideo()) { setBlocked(true); setPaused(true); } };
    internal?.addEventListener?.("onAutoplayBlocked", listener);
    autoplayCleanup.current = () => {
      try { internal?.removeEventListener?.("onAutoplayBlocked", listener); }
      finally { delete window[listener]; }
    };
  }
  function syncSound() {
    const actual = player.current?.isMuted?.();
    if (typeof actual === "boolean" && actual !== muted) onSoundChange(actual);
  }
  function play() {
    // Keep the iframe API calls inside the tap so iOS can grant audible playback.
    if (!muted) player.current?.unMute?.();
    player.current?.playVideo?.();
    setBlocked(false);
    setPaused(false);
  }
  function toggleSound() {
    if (muted) {
      player.current?.unMute?.();
      player.current?.playVideo?.();
      setPaused(false);
      setBlocked(false);
    } else player.current?.mute?.();
    onSoundChange(!muted);
  }
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
      <ReactPlayer onReady={ready} onProgress={syncSound} url={`https://www.youtube.com/watch?v=${videoId(video)}`}
        width="100%" height="100%" playing={enabled && !paused && visible} muted={muted}
        controls playsinline loop config={{ youtube: { playerVars: { playsinline: 1, rel: 0 } } }}
        onPlay={() => {
          if (!enabled || document.hidden || !matchesVideo()) {
            player.current?.pauseVideo?.();
            return;
          }
          setPaused(false);
          setBlocked(false);
          syncSound();
          if (!loading && !recorded.current) { recorded.current = true; recordHistory(video); }
        }} onPause={() => { if (enabled && !document.hidden && matchesVideo()) setPaused(true); }} onError={() => { if (matchesVideo()) setFailed(true); }} />
    </div>
    <div className="short-actions">
      <button className="button" onClick={() => paused || blocked ? play() : setPaused(true)} aria-label={paused || blocked ? "Play Short" : "Pause Short"}>{blocked && !muted ? "Play with sound" : paused ? "Play" : "Pause"}</button>
      <button className="button" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Mute Short"}>{muted ? "Sound on" : "Mute"}</button>
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
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem("devtubes:shorts-muted") === "true"; }
    catch { return false; }
  });
  const [bounds, setBounds] = useState(null);
  const cards = useRef([]);
  const currentVideo = videos[active];
  function changeSound(value) {
    setMuted(value);
    try { localStorage.setItem("devtubes:shorts-muted", String(value)); } catch { /* Playback still works without storage. */ }
  }
  useLayoutEffect(() => {
    const element = feed.current;
    const media = cards.current[active]?.querySelector(".short-media");
    if (!element || !media) return;
    const measure = () => {
      const rect = media.getBoundingClientRect();
      const root = element.getBoundingClientRect();
      setBounds({ top: rect.top - root.top + element.scrollTop,
        left: rect.left - root.left, width: rect.width, height: rect.height });
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    observer?.observe(media);
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [active, videos.length]);
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
    {videos.map((video, index) => <article ref={element => { cards.current[index] = element; }} className="short-card" key={videoId(video)}
      aria-owns={index === active ? "shorts-live-player" : undefined}
      data-video-id={videoId(video)} data-active={index === active} aria-label={video.snippet.title}>
      <div className="short-content">
        <div className="short-stage">
          <div className="short-media">
            <div className="short-poster"><Thumbnail item={video} /></div>
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
    {videos.length > 0 && <div id="shorts-live-player" className="short-media short-live-slot"
      aria-hidden={!currentVideo} style={{ ...bounds, visibility: currentVideo && bounds ? "visible" : "hidden" }}>
      {/* Moving this stable layer keeps the same iframe and its audio permission.
          Switching keyed players inside each card can reset that permission on phones. */}
      <ShortPlayer video={currentVideo || videos[videos.length - 1]} enabled={Boolean(currentVideo)} muted={muted} onSoundChange={changeSound} />
    </div>}
    <div className="shorts-end">
      {hasMore ? <button className="button" onClick={onLoadMore} disabled={more}>{more ? "Loading…" : "Find more Shorts"}</button>
        : <p>You’re all caught up. Pick another topic or refresh.</p>}
    </div>
  </section>;
}
