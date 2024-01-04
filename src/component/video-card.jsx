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
import { HtmlContent } from "../utils/utils";

const VideoCard = ({ video }) => {
  const snippet = video.snippet;
  const videoId = video.id.videoId;

  if (!snippet?.thumbnails?.high?.url) return null;

  return (
    <div
      className={` 
    sm:w-[300px] w-11/12
    mx-auto 
    mb-0 md:mb-0 mt-3 md:mt-0
    min-w-[280px] flex flex-col
    border border-gray-2000
    shadow-gray-200
    shadow-sm
    bg-white
    !rounded-2xl
    `}
    >
      <Link to={videoId ? `/video/${videoId}` : demoVideoUrl}>
        <CardMedia
          image={
            snippet?.thumbnails?.high?.url
              ? snippet?.thumbnails?.high?.url
              : demoThumbnailUrl
          }
          alt={snippet?.title}
          className="aspect-video rounded-t-xl"
        />
      </Link>

      {/* Text part */}
      <div className="flex flex-col">
        {/* Video info Section */}
        <div className="px-4 ">
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
            <HtmlContent
              content={
                normalzeVideoTitle(snippet?.title.slice(0, 92)) ||
                demoVideoTitle.slice(0, 92)
              }
            />

            {snippet?.title.length > 92 ? " . . ." : ""}
          </Link>
        </div>

        {/* Channel info Section */}
        <div className="px-4 pb-3 pt-3 flex items-end">
          {/* channel title */}
          <a
            href={
              snippet?.channelId
                ? `/channel/${snippet?.channelId}`
                : demoChannelUrl
            }
            className="text-sm md:text-sm text-gray-600 font-bold "
          >
            {snippet?.channelTitle || demoChannelTitle}
          </a>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
