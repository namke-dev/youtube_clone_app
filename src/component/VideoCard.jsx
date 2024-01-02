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
import { normalzeVideoTitle } from "../utils/utils";
import { formatRelativeTime } from "../utils/utils";

const VideoCard = ({ video, direction }) => {
  const snippet = video.snippet;
  const videoId = video.id.videoId;

  if (!snippet?.thumbnails?.high?.url) return null;

  return (
    <div
      className={`bg-gray-600 
    ${direction === "row" ? "sm:w-[300px]" : "w-11/12"}
    mx-auto 
    mb-0 md:mb-0 mt-3 md:mt-0
    min-w-[280px] flex flex-col`}
    >
      <Link
        to={videoId ? `/video/${videoId}` : demoVideoUrl}
        className="w-full"
      >
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

      {/* Text part */}
      <div
        className="w-full bg-red-700
       flex-grow
       flex flex-col
       "
      >
        {/* Video info Section */}
        <div className="bg-white shadow-sm px-4">
          {/* pushlished time */}
          <p className="pb-2 font-thin text-xs pt-2 self-end">
            {formatRelativeTime(snippet?.publishedAt)}
          </p>
          {/* Video title */}
          <Link
            className="text-base md:text-sm font-semibold pb-1 text-gray-800"
            to={videoId ? `/video/${videoId}` : demoVideoUrl}
            title={snippet?.title}
          >
            {normalzeVideoTitle(snippet?.title.slice(0, 92)) ||
              demoVideoTitle.slice(0, 92)}
            {snippet?.title.length > 92 ? " . . ." : ""}
          </Link>
        </div>

        {/* Channel info Section */}
        <div className="bg-white shadow-sm px-4 pb-3 pt-3 flex-grow flex items-end">
          {/* channel title */}
          <a
            href={
              snippet?.channelId
                ? `/channel/${snippet?.channelId}`
                : demoChannelUrl
            }
            className="text-sm md:text-sm text-gray-600 font-bold"
          >
            {snippet?.channelTitle || demoChannelTitle}
          </a>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
