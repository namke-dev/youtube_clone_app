import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "@mui/icons-material";
import { demoProfilePicture } from "../utils/constants";

const ChannelCard = ({ channelDetail, direction }) => {
  const { id, snippet, statistics } = channelDetail || {};

  return (
    <div
      className={`flex ${direction === "row" ? "sm:w-[310px]" : "w-11/12"} 
      p-3
      mx-auto mb-0 
      md:mb-5 mt-3 
      md:mt-0 
      items-center
      border border-gray-200
      shadow-gray-200 shadow-sm
      !rounded-2xl
      bg-white
      `}
    >
      <Link
        to={`/channel/${id?.channelId}`}
        className="text-center flex flex-col items-center w-full"
      >
        <img
          src={snippet?.thumbnails?.high?.url || demoProfilePicture}
          alt={snippet?.title}
          className="rounded-full
            h-48 w-48 
            border border-gray-200 
            mb-2 
            justify-center
            shadow-gray-200 !shadow-md
        "
        />
        <p className="text-lg font-bold text-gray-600">
          {snippet?.title}
          <CheckCircle className="text-gray-500 ml-1" />
        </p>

        {statistics?.subscriberCount && (
          <p className="text-sm">
            {parseInt(statistics?.subscriberCount).toLocaleString()} Subscribers
          </p>
        )}

        {statistics?.viewCount && (
          <p className="text-sm">
            {parseInt(statistics?.viewCount).toLocaleString()} views
          </p>
        )}
      </Link>
    </div>
  );
};

export default ChannelCard;
