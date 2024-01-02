import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "@mui/icons-material";
import { demoProfilePicture } from "../utils/constants";

const ChannelCard = ({ channelDetail, direction }) => {
  const { id, snippet, statistics } = channelDetail || {};

  return (
    <div
      className={`flex ${
        direction === "row" ? "sm:w-[300px]" : "w-11/12"
      } mx-auto mb-0 md:mb-0 mt-3 md:mt-0 rounded-2xl`}
    >
      <Link
        to={`/channel/${id?.channelId}`}
        className="text-center flex flex-col items-center w-full"
      >
        <img
          src={snippet?.thumbnails?.high?.url || demoProfilePicture}
          alt={snippet?.title}
          className="rounded-full h-48 w-48 border border-gray-300 mb-2 justify-center"
        />
        <p className="text-2xl font-semibold">
          {snippet?.title}
          <CheckCircle className="text-gray-500 text-sm" />
        </p>

        {statistics?.subscriberCount && (
          <p className="text-base font-thin">
            {parseInt(statistics?.subscriberCount).toLocaleString()} Subscribers
          </p>
        )}

        {statistics?.viewCount && (
          <p className="font-xs font-thin">
            {parseInt(statistics?.viewCount).toLocaleString()} views
          </p>
        )}
      </Link>
    </div>
  );
};

export default ChannelCard;
