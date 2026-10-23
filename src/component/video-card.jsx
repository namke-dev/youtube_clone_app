import React from "react";
import { Link } from "react-router-dom";
import { Thumbnail, formatCount } from "./ui";
import VideoLink from "./video-link";
import { videoId } from "../utils/library";
export default function VideoCard({ video }) {
  const id = videoId(video);
  if (!id) return null;
  const s = video.snippet || {};
  return (
    <article className="video-card">
      <VideoLink
        className="thumbnail"
        to={`/video/${encodeURIComponent(id)}`}
        aria-label={`Watch ${s.title || "video"}`}
      >
        <Thumbnail item={video} />
      </VideoLink>
      <h3>
        <VideoLink to={`/video/${encodeURIComponent(id)}`}>
          {s.title || "Untitled video"}
        </VideoLink>
      </h3>
      <div className="video-meta">
        {s.channelId ? (
          <Link to={`/channel/${encodeURIComponent(s.channelId)}`}>
            {s.channelTitle}
          </Link>
        ) : (
          s.channelTitle
        )}
        {video.statistics?.viewCount && (
          <span> · {formatCount(video.statistics.viewCount)} views</span>
        )}
      </div>
    </article>
  );
}
