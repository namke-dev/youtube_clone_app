import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchFromApi } from "../utils/fetchFromApi";
import ChannelCard from "./channel-card";
import Videos from "./videos";
import { useLoading } from "../context/loading-context";

const ChannelDetail = () => {
  const [channelDetail, setChannelDetail] = useState(null);
  const [channelVideos, setChannelVideos] = useState(null);
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 768);
  const handleResize = () => {
    setIsWideScreen(window.innerWidth > 640);
  };
  const { id } = useParams();
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    if (!id) return;
    console.log(`Channel id: ${id}`);
    startLoading();

    const fetchData = async () => {
      try {
        const channelData = await fetchFromApi(
          `channels?part=snippet&id=${id}`
        );
        setChannelDetail(channelData?.items[0]);

        const VideosData = await fetchFromApi(
          `search?channelId=${id}&part=snippet&order=date`
        );
        setChannelVideos(VideosData.items);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        stopLoading();
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <div className="mb-5 py-5 bg-sky-100 shadow-sm">
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
