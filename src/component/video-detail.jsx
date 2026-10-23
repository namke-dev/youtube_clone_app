import React, { useState, useEffect, useMemo } from "react";
import ReactPlayer from "react-player/youtube";
import { Link, useParams } from "react-router-dom";
import { useResource, Status, formatCount } from "./ui";
import {
  readLibrary,
  saveVideo,
  removeVideo,
  recordHistory,
} from "../utils/library";
import Videos from "./videos";
import { rankCandidates } from "../utils/discovery";
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
  return <VideoContent key={id} id={id} />;
}
function VideoContent({ id }) {
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
  useEffect(() => {
    setRelated(false);
    setComments(false);
    setExpanded(false);
    setNotice("");
    setPlayerError(false);
    setSaved(readLibrary("saved").some((v) => v.id === id));
  }, [id]);
  function toggleSave() {
    const success = saved ? removeVideo("saved", id) : saveVideo(video);
    if (success) {
      setSaved(!saved);
      setNotice(saved ? "Removed from saved videos." : "Saved on this device.");
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
          <div className="player">
            <ReactPlayer
              key={id}
              url={`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`}
              controls
              playing={false}
              width="100%"
              height="100%"
              onPlay={() => recordHistory(video)}
              onError={() => setPlayerError(true)}
            />
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
