import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchFromApi } from "../utils/fetchFromApi";
import ChannelCard from "./channel-card";
import Videos from "./videos";
import { useLoading } from "../context/loading-context";

const ChannelDetail = () => {
  const [channelDetail, setChannelDetail] = useState(null);
  const [channelVideos, setChannelVideos] = useState(null);

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
          `search?channelId=${id}&part=snippet&order=date&maxResults=48`
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

  return (
    <div className="overflow-y h-[100vh] ">
      <div className="mb-5 mt-3 py-5">
        <ChannelCard channelDetail={channelDetail}></ChannelCard>
      </div>

      <div className="flex md:mx-20">
        <div className="h-90vh flex-wrap" />
        <Videos
          direction={window.innerWidth >= 768 ? "row" : "column"}
          videos={channelVideos}
        />
      </div>
    </div>
  );
};

export default ChannelDetail;
