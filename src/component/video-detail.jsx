import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ReactPlayer from "react-player/youtube";
import { Link, useParams } from "react-router-dom";
import { useResource, Status, formatCount, Icon } from "./ui";
import {
  readLibrary,
  saveVideo,
  removeVideo,
  recordHistory,
} from "../utils/library";
import Videos from "./videos";
import { useAccount } from "../context/account-context";
import { readAutoFullscreen, saveAutoFullscreen, requestVideoFullscreen, isVideoFullscreen, exitVideoFullscreen, isMobilePlayback, isLandscapeVideo, setVideoLandscape, setVideoFullscreenAppearance } from "../utils/playback";
import { rankCandidates } from "../utils/discovery";
let autoplayListenerId = 0;

function Comments({ id }) {
  const state = useResource(
    `commentThreads?videoId=${encodeURIComponent(id)}&part=snippet&maxResults=20`,
  );
  return (
    <div className="comments">
      <Status {...state} />
      {state.data?.items.length === 0 && <p>No comments available.</p>}
      {state.data?.items.map((item) => {
        const s = item.snippet?.topLevelComment?.snippet;
        return s ? (
          <article key={item.id}>
            <strong>{s.authorDisplayName}</strong>
            <p>
              {s.textOriginal || s.textDisplay?.replace(/<[^>]*>/g, "") || ""}
            </p>
          </article>
        ) : null;
      })}
    </div>
  );
}
export default function VideoDetail() {
  const { id } = useParams();
  // This wrapper survives watch-to-watch navigation. Cleanup belongs here,
  // rather than in the keyed content that is replaced for each video.
  useEffect(() => () => {
    if (isVideoFullscreen() || document.documentElement.classList.contains("video-fullscreen") ||
        document.documentElement.classList.contains("video-playback-dark")) {
      void exitVideoFullscreen();
    }
  }, []);
  return <VideoContent key={id} id={id} />;
}
function VideoContent({ id }) {
  const { loading: accountLoading } = useAccount();
  const state = useResource(
    `videos?part=snippet,statistics,contentDetails&id=${encodeURIComponent(id)}`,
  );
  const video = state.data?.items[0];
  const [related, setRelated] = useState(false);
  const relatedState = useResource(
    related
      ? `search?relatedToVideoId=${encodeURIComponent(id)}&part=id,snippet&type=video&maxResults=50`
      : null,
  );
  const [history, setHistory] = useState(() =>
    JSON.stringify(readLibrary("history").map(v => v.id)),
  );
  useEffect(() => {
    const changed = () => setHistory(JSON.stringify(readLibrary("history").map(v => v.id)));
    window.addEventListener("devtubes-library", changed);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener("devtubes-library", changed);
      window.removeEventListener("storage", changed);
    };
  }, []);
  const relatedTitle = video?.snippet?.title || "";
  const relatedVideos = useMemo(() => rankCandidates(relatedState.data?.items || [], {
    query: relatedTitle,
    watchedIds: new Set([id, ...JSON.parse(history)]),
    limit: 12,
  }), [relatedState.data, relatedTitle, id, history]);
  const [comments, setComments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [playerError, setPlayerError] = useState(false);
  const [autoFullscreen, setAutoFullscreen] = useState(readAutoFullscreen);
  const [fullscreen, setFullscreen] = useState(false);
  const playerElement = useRef(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimer = useRef(null);
  const keyboardControls = useRef(false);
  const revealControls = useCallback(() => {
    clearTimeout(controlsTimer.current);
    setControlsVisible(true);
    if (fullscreen) {
      controlsTimer.current = setTimeout(() => {
        if (!keyboardControls.current || !playerElement.current?.contains(document.activeElement)) setControlsVisible(false);
      }, 3000);
    }
  }, [fullscreen]);
  useEffect(() => {
    revealControls();
    if (!fullscreen) return () => clearTimeout(controlsTimer.current);
    const key = () => { keyboardControls.current = true; revealControls(); };
    // YouTube's cross-origin iframe cannot bubble pointer events to this page.
    // Its focus and playback callbacks also wake the surrounding controls.
    const frameFocus = () => { if (playerElement.current?.contains(document.activeElement)) revealControls(); };
    window.addEventListener("keydown", key);
    window.addEventListener("blur", frameFocus);
    return () => {
      clearTimeout(controlsTimer.current);
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", frameFocus);
    };
  }, [fullscreen, revealControls]);
  function pointerActivity() {
    keyboardControls.current = false;
    revealControls();
  }
  const [mobile] = useState(isMobilePlayback);
  const [muted, setMuted] = useState(isMobilePlayback);
  const [playerReady, setPlayerReady] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [landscape, setLandscape] = useState(true);
  const internalPlayer = useRef(null);
  const autoplayCleanup = useRef(null);
  useEffect(() => () => autoplayCleanup.current?.(), []);
  useEffect(() => { setLandscape(isLandscapeVideo(video)); }, [video]);
  useEffect(() => {
    setVideoLandscape(fullscreen && mobile && landscape);
    return () => setVideoLandscape(false);
  }, [fullscreen, mobile, landscape]);
  function ready(player) {
    autoplayCleanup.current?.();
    const internal = player.getInternalPlayer();
    internalPlayer.current = internal;
    setPlayerReady(Boolean(internal));
    // YouTube's documented dynamic event API takes a global function name.
    const listener = `__devtubesAutoplayBlocked${++autoplayListenerId}`;
    window[listener] = () => setPlaybackBlocked(true);
    internal?.addEventListener?.("onAutoplayBlocked", listener);
    autoplayCleanup.current = () => {
      try { internal?.removeEventListener?.("onAutoplayBlocked", listener); }
      finally { delete window[listener]; }
    };
  }
  function playWithSound() {
    // Call the iframe API directly during the tap. Waiting for a React update
    // can lose iOS's permission to start audible playback.
    try {
      internalPlayer.current?.unMute?.();
      internalPlayer.current?.playVideo?.();
      setMuted(false);
      setPlaybackBlocked(false);
    } catch {
      setPlaybackBlocked(true);
    }
  }
  useEffect(() => {
    const changed = () => {
      const active = isVideoFullscreen();
      setFullscreen(active);
      setVideoFullscreenAppearance(active);
      if (!document.fullscreenElement) document.documentElement.classList.remove("video-fullscreen");
    };
    setFullscreen(isVideoFullscreen());
    const keydown = (event) => {
      if (event.key === "Escape" && document.documentElement.classList.contains("video-expanded")) {
        void exitVideoFullscreen();
      }
    };
    document.addEventListener("fullscreenchange", changed);
    document.addEventListener("devtubes-fullscreen", changed);
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("fullscreenchange", changed);
      document.removeEventListener("devtubes-fullscreen", changed);
      document.removeEventListener("keydown", keydown);
    };
  }, []);
  function changeAutoFullscreen(event) {
    const enabled = event.target.checked;
    setAutoFullscreen(enabled);
    if (!saveAutoFullscreen(enabled)) {
      setNotice("Your browser could not save this preference. Fullscreen is still available below.");
    }
  }
  async function enterFullscreen() {
    if (!await requestVideoFullscreen(playerElement.current)) {
      setNotice("Fullscreen is unavailable here. You can try the video's fullscreen control.");
    }
  }
  useEffect(() => {
    setRelated(false);
    setComments(false);
    setExpanded(false);
    setNotice("");
    setPlayerError(false);
  }, [id]);
  useEffect(() => {
    const changed = () => {
      setSaved(readLibrary("saved").some(v => v.id === id));
      setNotice("");
    };
    changed();
    window.addEventListener("devtubes-library", changed);
    window.addEventListener("storage", changed);
    return () => {
      window.removeEventListener("devtubes-library", changed);
      window.removeEventListener("storage", changed);
    };
  }, [id, accountLoading]);
  function toggleSave() {
    if (accountLoading) return;
    const alreadySaved = readLibrary("saved").some(v => v.id === id);
    const success = alreadySaved ? removeVideo("saved", id) : saveVideo(video);
    if (success) {
      setSaved(!alreadySaved);
      setNotice(alreadySaved ? "Removed from saved videos." : "Saved on this device.");
    } else
      setNotice(
        "Your browser could not save this video. Storage may be full or disabled.",
      );
  }
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share)
        await navigator.share({ title: video?.snippet?.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setNotice("Link copied.");
      }
    } catch (e) {
      if (e.name !== "AbortError") setNotice(`Copy this link: ${url}`);
    }
  }
  if (!video)
    return (
      <main id="main" className="watch-shell">
        {fullscreen && (
          <button className="button" onClick={() => { void exitVideoFullscreen(); }}>Exit fullscreen</button>
        )}
        <Status {...state} empty={!state.loading && !state.error} />
        <Link className="text-link" to="/">
          Back to Discover
        </Link>
      </main>
    );
  const s = video.snippet || {};
  return (
    <main id="main" className="watch-shell">
      <div className="watch-layout">
        <div className="watch-main">
          <div className={`player ${fullscreen && !controlsVisible ? "fullscreen-controls-hidden" : ""}`} ref={playerElement}
            onPointerMove={event => { if (event.pointerType !== "touch") revealControls(); }}
            onPointerDownCapture={pointerActivity} onFocusCapture={revealControls} onBlurCapture={revealControls}>
            <div className="player-viewport"><div className="player-stage">
            <ReactPlayer
              key={id}
              url={`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`}
              controls
              playing={!accountLoading}
              muted={muted}
              onReady={ready}
              playsinline={true}
              width="100%"
              height="100%"
              onPlay={() => { revealControls(); setPlaybackBlocked(false); if (!accountLoading) recordHistory(video); }}
              onPause={revealControls}
              onError={() => setPlayerError(true)}
            />
            </div></div>
            <div className="player-controls">
            {playerReady && (playbackBlocked || muted) && (
              <button className="button playback-start" onClick={playWithSound}>
                {playbackBlocked ? "Tap to play" : "Tap for sound"}
              </button>
            )}
            {fullscreen && mobile && (
              <button className="button landscape-toggle" onClick={() => setLandscape(value => !value)} aria-pressed={landscape}>
                Rotate view
              </button>
            )}
            {fullscreen && (
              <button className="button fullscreen-exit" aria-label="Exit fullscreen" title="Exit fullscreen" onClick={() => {
                void exitVideoFullscreen();
              }}><Icon className="fullscreen-exit-icon" name="fullscreenExit" /><span>Exit fullscreen</span></button>
            )}
            </div>
          </div>
          <div className="playback-options">
            <label>
              <input type="checkbox" checked={autoFullscreen} onChange={changeAutoFullscreen} />
              Open videos in fullscreen
            </label>
            <button className="button" onClick={enterFullscreen}>Fullscreen</button>
          </div>
          {playerError && (
            <p role="alert" className="inline-error">
              This video cannot play here.{" "}
              <a
                href={`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`}
                target="_blank"
                rel="noreferrer"
              >
                Watch on YouTube
              </a>
              .
            </p>
          )}
          <h1>{s.title}</h1>
          <p className="video-meta">
            {formatCount(video.statistics?.viewCount) &&
              `${formatCount(video.statistics.viewCount)} views · `}
            {s.publishedAt && new Date(s.publishedAt).toLocaleDateString()}
          </p>
          <div className="creator-row">
            <Link className="creator" to={`/channel/${s.channelId}`}>
              <span className="creator-avatar">
                {s.channelTitle?.slice(0, 1) || "▶"}
              </span>
              <span>
                <strong>{s.channelTitle}</strong>
                <small>View channel →</small>
              </span>
            </Link>
            <div className="actions">
              {video.statistics?.likeCount && (
                <span className="stat" title="YouTube like count; read-only">
                  ♡ {formatCount(video.statistics.likeCount)}
                </span>
              )}
              <button
                className={`button ${saved ? "primary" : ""}`}
                onClick={toggleSave}
                aria-pressed={saved}
                disabled={accountLoading}
              >
                {saved ? "Saved" : "Save"}
              </button>
              <button className="button" onClick={share}>
                Share
              </button>
            </div>
          </div>
          <p className="notice" role="status">
            {notice}
          </p>
          <section className="description">
            <h2>About this video</h2>
            <p className={expanded ? "" : "clamped"}>
              {s.description || "No description provided."}
            </p>
            {s.description && (
              <button
                className="text-button"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </section>
          <section className="comment-section">
            <div className="section-heading">
              <h2>Conversation</h2>
              <button
                className="text-button"
                onClick={() => setComments(!comments)}
                aria-expanded={comments}
              >
                {comments ? "Hide comments" : "Load comments"}
              </button>
            </div>
            <p className="video-meta">Comments from YouTube · Read-only</p>
            {comments && <Comments key={id} id={id} />}
          </section>
        </div>
        <aside className="watch-next">
          <h2>Keep exploring</h2>
          <p>More to get lost in.</p>
          {!related ? (
            <div className="related-prompt">
              <p>Find more videos like this when you’re ready.</p>
              <button className="button" onClick={() => setRelated(true)}>
                Find related videos
              </button>
            </div>
          ) : (
            <>
              <Status
                {...relatedState}
                empty={
                  !relatedState.loading &&
                  !relatedState.error &&
                  !relatedVideos.length
                }
              />
              <Videos videos={relatedVideos} />
            </>
          )}
          <Link className="text-link" to="/">
            Back to Discover →
          </Link>
        </aside>
      </div>
    </main>
  );
}
