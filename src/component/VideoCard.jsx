import React from "react";
import {
  demoThumbnailUrl,
  demoVideoUrl,
  demoVideoTitle,
  demoChannelUrl,
  demoChannelTitle,
} from "../utils/constants";
import { CardMedia } from "@mui/material";
import { Link } from "react-router-dom";

const VideoCard = ({ video, direction }) => {
  const snippet = video.snippet;
  const videoId = video.id.videoId;

  return (
    <div
      className={`bg-red-600 
      ${direction === "row" ? "sm:w-[280px]" : "w-11/12"}
      justify-center items-center 
      mx-auto 
      mb-0 sm:mb-0 mt-3 sm:mt-0`}
    >
      <Link to={videoId ? `/video/${videoId}` : demoVideoUrl}>
        <CardMedia
          image={
            snippet?.thumbnails?.high?.url
              ? snippet?.thumbnails?.high?.url
              : demoThumbnailUrl
          }
          alt={snippet?.title}
          className="w-full aspect-video"
        />
      </Link>

      <div className="bg-white shadow-sm mb-3 px-2 pt-2 pb-4">
        <Link to={videoId ? `/video/${videoId}` : demoVideoUrl}>
          <p className="text-sm font-semibold mb-2">
            {snippet?.title.slice(0, 60) || demoVideoTitle.slice(0, 60)}
          </p>
        </Link>

        <Link
          to={
            snippet?.channelId
              ? `/channel/${snippet?.channelId}`
              : demoChannelUrl
          }
        >
          <p className="text-xs text-gray-500 font-bold">
            {snippet?.channelTitle || demoChannelTitle}
          </p>
        </Link>
      </div>
    </div>
  );
};

export default VideoCard;
