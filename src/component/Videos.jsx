import { Stack } from "@mui/material";

import ChannelCard from "./channel-card";
import VideoCard from "./video-card";

const Videos = ({ videos, direction }) => {
  if (!videos?.length) {
    return "";
  }
  return (
    <Stack
      className={`flex ${
        direction === "column" ? "!flex-col" : "!flex-row sm:flex-wrap"
      }  
        justify-center
        gap-5 xl:gap-3`}
    >
      {videos.map((item, idx) => (
        <div key={idx} className="my-0 mx-0 flex">
          {item.id.videoId && <VideoCard video={item} direction={direction} />}
          {item.id.channelId && (
            <ChannelCard channelDetail={item} direction={direction} />
          )}
        </div>
      ))}
    </Stack>
  );
};

export default Videos;
