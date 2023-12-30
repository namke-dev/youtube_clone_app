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
        direction === "column" ? "!flex-col" : "!flex-row"
      } flex-wrap gap-2 justify-center`}
    >
      {videos.map((item, idx) => (
        <Box key={idx}>
          {item.id.videoId && <VideoCard video={item} />}
          {item.id.channelId && <ChannelCard channelDetail={item} />}
        </Box>
      ))}
    </Stack>
  );
};

export default Videos;
