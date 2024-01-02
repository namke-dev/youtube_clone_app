import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchFromApi } from "../utils/fetchFromApi";
import ChannelCard from "./ChannelCard";
import Videos from "./Videos";

const ChannelDetail = () => {
  const [channelDetail, setChannelDetail] = useState(null);
  const [channelVideos, setChannelVideos] = useState(null);
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 768);
  const handleResize = () => {
    setIsWideScreen(window.innerWidth > 640);
  };

  const { id } = useParams();

  useEffect(() => {
    fetchFromApi(`channels?part=snippet&id=${id}`).then((data) =>
      setChannelDetail(data?.items[0])
    );

    fetchFromApi(`search?channelId=${id}&part=snippet&order=date`).then(
      (data) => setChannelVideos(data?.items)
    );
  }, [id]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <div className="my-5 py-5 bg-gray-100">
        <ChannelCard channelDetail={channelDetail}></ChannelCard>
      </div>

      <div className="flex p-2">
        <div className="h-90vh flex-wrap" />
        {isWideScreen ? (
          <Videos direction="row" videos={channelVideos} />
        ) : (
          <Videos direction="column" videos={channelVideos} />
        )}
      </div>
    </>
  );
};

export default ChannelDetail;
