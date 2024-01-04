import ChannelCard from "./channel-card";
import VideoCard from "./video-card";

const Videos = ({ videos, direction }) => {
  if (!videos?.length) {
    return "";
  }
  return (
    <div
      className={`flex ${
        direction === "column" ? "flex-col" : "flex-row flex-wrap"
      }  
        justify-center
        gap-0 lg:gap-3 sm:gap-5`}
    >
      {videos.map((item, idx) => (
        <div key={idx} className="my-0 mx-0 flex flex-grow">
          {item.id.videoId && <VideoCard video={item} />}
          {item.id.channelId && (
            <ChannelCard channelDetail={item} direction={direction} />
          )}
        </div>
      ))}
    </div>
  );
};

export default Videos;
