import { Box, Stack } from "@mui/material";

import ChannelCard from "./ChannelCard";
import VideoCard from "./VideoCard";

const Videos = (videos) => {
  videos = videos.videos;

  if (videos === null) {
    console.log("Videos object is null");
    return <span>Loading ...</span>;
  }
  return (
    <Stack direction="row" flexWrap="wrap" justifyContent="start" gap={2}>
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
