import React from "react";
import { Link } from "react-router-dom";
import { CardMedia } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { demoProfilePicture } from "../utils/constants";

const ChannelCard = ({ channelDetail, direction }) => {
  const { id, snippet, statistics } = channelDetail || {};

  return (
    <div
      className={`flex ${
        direction === "row" ? "sm:w-[300px]" : "w-11/12"
      } justify-center items-center text-center mx-auto mb-0 md:mb-0 mt-3 md:mt-0 rounded-2xl`}
    >
      <Link to={`/channel/${id?.channelId}`}>
        <CardMedia
          image={snippet?.thumbnails?.high?.url || demoProfilePicture}
          alt={snippet?.title}
          className="rounded-full h-48 w-48 border border-gray-300"
        />
        <p className="text-2xl font-semibold py-3">
          {snippet?.title}
          <CheckCircle className="text-gray-500 text-sm" />
        </p>
        {statistics?.subscriberCount && (
          <p className="text-base font-thin">
            {parseInt(statistics?.subscriberCount).toLocaleString()} Subscribers
          </p>
        )}
      </Link>
    </div>
  );
};

export default ChannelCard;
