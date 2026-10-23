import React from "react";
import { Link } from "react-router-dom";
import VideoCard from "./video-card";
import { Thumbnail } from "./ui";
import { videoId } from "../utils/library";
export default function Videos({ videos = [] }) {
  return (
    <div className="video-grid">
      {videos.map((video, i) =>
        video.id?.channelId ? (
          <Link
            className="channel-result"
            to={`/channel/${video.id.channelId}`}
            key={video.id.channelId}
          >
            <Thumbnail item={video} />
            <h3>{video.snippet?.title}</h3>
            <p>View channel →</p>
          </Link>
        ) : (
          <VideoCard video={video} key={videoId(video) || i} />
        ),
      )}
    </div>
  );
}
