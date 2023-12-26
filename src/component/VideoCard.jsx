import React from "react";
import {
  demoThumbnailUrl,
  demoVideoUrl,
  demoVideoTitle,
  demoChannelUrl,
  demoChannelTitle,
} from "../utils/constants";
import { Card, CardMedia } from "@mui/material";
import { Link } from "react-router-dom";
const VideoCard = (video) => {
  const snippet = video.video.snippet;
  const videoId = video.video.id.videoId;
  return (
    <Card>
      <Link to={videoId ? `/video/${videoId}` : demoVideoUrl}>
        <CardMedia
          image={snippet?.thumbnails?.high?.url}
          alt={snippet?.title}
          sx={{ width: 358, height: 180 }}
        />
      </Link>
    </Card>
  );
};

export default VideoCard;
