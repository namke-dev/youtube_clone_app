import React, { useEffect } from "react";
import ReactPlayer from "react-player";
import { Link, useParams } from "react-router-dom";
import { fetchFromApi } from "../utils/fetchFromApi";
import { useState } from "react";
import { CheckCircle } from "@mui/icons-material";
import { Videos } from "../component";

const VideoDetail = () => {
  const id = useParams();
  const [videoDetail, setVideoDetail] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState(null);

  useEffect(() => {
    fetchFromApi(`videos?part=snippet,statistics&id=${id.id}`).then((data) =>
      setVideoDetail(data.items[0])
    );

    fetchFromApi(`search?part=snippet&id=${id}&type=video`).then((data) =>
      setRelatedVideos(data.items)
    );
  }, [id]);

  if (!videoDetail) {
    return "Loading ...";
  }

  const {
    snippet: { title, channelId, channelTitle },
    statistics: { viewCount, likeCount },
  } = videoDetail;
  return (
    <div className="min-h-screen">
      <div className="flex flex-col md:flex-row">
        <div className="flex-1">
          <div className="mt-8 flex flex-col justify-center items-center">
            {/* Video Player */}
            <div className="rounded-3xl w-4/5 aspect-video">
              <ReactPlayer
                url={`https://www.youtube.com/watch?v=${id.id}`}
                controls
                playing={true}
                width="100%"
                height="100%"
              />
            </div>

            {/* Video Title */}
            <div className="text-xl font-bold mt-4 text-left w-4/5">
              {title}
            </div>

            {/* Channel Details and Video Stats */}
            <div className="flex justify-between py-1 mt-2 w-4/5">
              {/* Channel Details */}
              <div className="flex flex-col text-left">
                <Link to={`/channel/${channelId}`}>
                  <p className="text-sm md:text-base text-gray-900">
                    {channelTitle}
                    <CheckCircle className="text-gray-500 ml-1" />
                  </p>
                </Link>

                {/* Add your channel subscribes here if needed */}
              </div>

              {/* Video Stats */}
              <div className="flex flex-col text-right">
                <div className="text-sm text-gray-700">
                  {parseInt(viewCount).toLocaleString()} views
                </div>

                <div className="text-sm text-gray-700">
                  {parseInt(likeCount).toLocaleString()} likes
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Second Box */}
        <div className="mr-12 py-8 justify-center items-center">
          <Videos direction="column" videos={relatedVideos} />
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;
