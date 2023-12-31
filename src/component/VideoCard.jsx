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
import { nomalzeVideoTitle } from "../utils/utils";

const VideoCard = ({ video, direction }) => {
  const snippet = video.snippet;
  const videoId = video.id.videoId;

  return (
    <div
      className={`bg-red-600 
      ${direction === "row" ? "sm:w-[300px]" : "w-11/12"}
      justify-center items-center 
      mx-auto 
      mb-0 md:mb-0 mt-3 md:mt-0`}
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

      <div
        className="bg-white 
        shadow-sm mb-3 px-4 
        py-4 min-h-[7.5rem]"
      >
        <Link
          to={videoId ? `/video/${videoId}` : demoVideoUrl}
          title={snippet?.title}
        >
          <p className="text-base md:text-sm font-semibold mb-2">
            {nomalzeVideoTitle(snippet?.title.slice(0, 92)) ||
              demoVideoTitle.slice(0, 92)}
            {snippet?.title.length > 92 ? " . . ." : ""}
          </p>
        </Link>

        <Link
          to={
            snippet?.channelId
              ? `/channel/${snippet?.channelId}`
              : demoChannelUrl
          }
        >
          <p className="text-sm md:text-xs text-gray-500 font-bold">
            {snippet?.channelTitle || demoChannelTitle}
          </p>
        </Link>
      </div>
    </div>
  );
};

export default VideoCard;
