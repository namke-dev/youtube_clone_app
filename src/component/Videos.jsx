import { Box, Stack } from "@mui/material";

import ChannelCard from "./ChannelCard";
import VideoCard from "./VideoCard";

const Videos = ({ videos, direction }) => {
  if (!videos?.length) {
    return "Loading ...";
  }
  return (
    <Stack
      className={`flex ${
        direction === "column" ? "!flex-col" : "!flex-row sm:flex-wrap"
      }  
        gap-2 justify-center       `}
    >
      {videos.map((item, idx) => (
        <div key={idx} className="mb-0">
          {item.id.videoId && <VideoCard video={item} direction={direction} />}
          {item.id.channelId && <ChannelCard channelDetail={item} />}
        </div>
      ))}
    </Stack>
  );
};

export default Videos;
