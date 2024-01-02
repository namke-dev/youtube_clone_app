import { CardMedia } from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";
import { demoProfilePicture } from "../utils/constants";
import { CheckCircle } from "@mui/icons-material";

const ChannelCard = ({ channelDetail, direction }) => (
  <div
    className={`
      ${direction === "row" ? "sm:w-[300px]" : "w-11/12"}
      justify-center items-center 
      mx-auto 
      mb-0 md:mb-0 mt-3 md:mt-0
      rounded-2xl
      flex
      `}
  >
    <Link to={`/channel/${channelDetail?.id?.channelId}`}>
      <CardMedia
        image={
          channelDetail?.snippet?.thumbnails?.high?.url || demoProfilePicture
        }
        alt={channelDetail?.snippet?.title}
        sx={{
          borderRadius: "50%",
          height: "180px",
          width: "180px",
          mb: 2,
          border: "1px solid #e3e3e3",
        }}
      ></CardMedia>
      <p className="text-xl">
        {channelDetail?.snippet?.title}
        <CheckCircle sx={{ fontSize: "14px", color: "gray" }} />
      </p>
      {channelDetail?.statistics?.subcriberCount && (
        <p>
          {parseInt(channelDetail?.statistics?.subcriberCount).toLocaleString}{" "}
          Subcribers
        </p>
      )}
    </Link>
  </div>
);

export default ChannelCard;
