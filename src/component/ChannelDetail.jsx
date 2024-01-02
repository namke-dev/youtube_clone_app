import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchFromApi } from "../utils/fetchFromApi";
import ChannelCard from "./ChannelCard";
import Videos from "./Videos";

const ChannelDetail = () => {
  const [channelDetail, setChannelDetail] = useState(null);
  const [channelVideos, setChannelVideos] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    fetchFromApi(`channels?part=snippet&id=${id}`).then((data) =>
      setChannelDetail(data?.items[0])
    );

    fetchFromApi(`search?channelId=${id}&part=snippet&order=date`).then(
      (data) => setChannelVideos(data?.items)
    );
  }, [id]);

  return (
    <>
      <div className="my-5 py-10 bg-gray-300">
        <ChannelCard channelDetail={channelDetail}></ChannelCard>
      </div>

      <div className="flex p-2">
        <div className="h-90vh flex-wrap" />
        <Videos direction="row" videos={channelVideos} />
      </div>
    </>
  );
};

export default ChannelDetail;
