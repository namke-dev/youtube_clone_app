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

const VideoCard = ({ video, direction }) => {
  const snippet = video.snippet;
  const videoId = video.id.videoId;

  if (!snippet?.thumbnails?.high?.url) return null;

  return (
    <div
      className={`bg-gray-600 
      ${direction === "row" ? "sm:w-[300px]" : "w-11/12"}
      justify-center items-center 
      mx-auto 
      mb-0 md:mb-0 mt-3 md:mt-0
      min-w-[280px] flex-row flex-grow`}
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

      {/* Text part */}
      <div className="flex flex-col flex-grow">
        {/* Top Section */}
        <div className="bg-white shadow-sm px-4 pt-4">
          <Link
            to={videoId ? `/video/${videoId}` : demoVideoUrl}
            title={snippet?.title}
          >
            <p className="text-base md:text-sm font-semibold mb-2">
              {normalzeVideoTitle(snippet?.title.slice(0, 92)) ||
                demoVideoTitle.slice(0, 92)}
              {snippet?.title.length > 92 ? " . . ." : ""}
            </p>
          </Link>
        </div>

        {/* Bottom Section */}
        <div className="bg-white shadow-sm  px-4 pb-4">
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
    </div>
  );
};

export default VideoCard;
