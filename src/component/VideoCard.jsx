import React from "react";
import {
  demoThumbnailUrl,
  demoVideoUrl,
  demoVideoTitle,
  demoChannelUrl,
  demoChannelTitle,
} from "../utils/constants";
import { Card, CardContent, CardMedia, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { CheckCircle } from "@mui/icons-material";
const VideoCard = (video) => {
  const snippet = video.video.snippet;
  const videoId = video.video.id.videoId;
  return (
    <Card className="w-280 bg-none">
      <Link to={videoId ? `/video/${videoId}` : demoVideoUrl}>
        <CardMedia
          image={snippet?.thumbnails?.high?.url}
          alt={snippet?.title}
          className="w-[280px] h-[157.5px]"
        />
      </Link>
      <CardContent className="w-[280px] h-[90px] bg-">
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
      </CardContent>
    </Card>
  );
};

export default VideoCard;
