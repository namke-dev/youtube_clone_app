import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { Link, useParams } from "react-router-dom";
import { fetchFromApi } from "../utils/fetchFromApi";
import { CheckCircle } from "@mui/icons-material";
import { Videos, Comments } from "../component";

const VideoDetail = () => {
  const { id } = useParams();
  const [videoDetail, setVideoDetail] = useState(null);

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const [relatedVideos, setRelatedVideos] = useState(null);
  const [isShowRelatedVideos, setIsShowRelatedVideos] = useState(false);

  const [comments, setComments] = useState(null);
  const [isShowComments, setIsShowComments] = useState(false);

  useEffect(() => {
    fetchFromApi(`videos?part=snippet,statistics&id=${id}`).then((data) =>
      setVideoDetail(data.items[0])
    );
  }, [id]);

  if (!videoDetail) {
    return "Loading ...";
  }

  const {
    snippet: { title, channelId, channelTitle, description, publishedAt },
    statistics: { viewCount, likeCount, commentCount },
  } = videoDetail;

  const fetchRelatedVideos = () => {
    fetchFromApi(
      `search?relatedToVideoId=${id}&part=id,snippet&type=video&maxResults=20`
    ).then((data) => setRelatedVideos(data.items));
    setIsShowRelatedVideos(true);
  };

  const fetchComments = () => {
    fetchFromApi(
      `commentThreads?videoId=${id}&part=snippet&maxResults=100`
    ).then((data) => setComments(data.items));
    setIsShowComments(true);
  };

  const truncatedDescription =
    description && !isDescriptionExpanded
      ? description.split(" ").slice(0, 50).join(" ") + "..."
      : description;

  return (
    <div className="flex flex-col lg:flex-row pb-12">
      <div className="flex-1">
        <div className="mt-8 md:mt-8 flex flex-col items-center md:w-85% mx-3 md:mx-10 ">
          {/* Video Player */}
          <div className="w-full aspect-video">
            <ReactPlayer
              url={`https://www.youtube.com/watch?v=${id}`}
              controls
              playing={true}
              width="100%"
              height="100%"
            />
          </div>

          {/* Video Title */}
          <div className="text-xl font-bold mt-2 text-left w-full">{title}</div>

          {/* Channel Details and Video Stats */}
          <div className="flex justify-between py-1 mt-2 w-full material-box">
            {/* Channel Details */}
            <div className="flex flex-col text-left">
              {/* Published Date */}
              <p className="text-xs md:text-sm text-gray-500">
                Published on {new Date(publishedAt).toLocaleDateString()}
              </p>

              {/* Channel Title */}
              <div className="text-sm md:text-xl text-gray-900  mt-2">
                <Link to={`/channel/${channelId}`}>
                  {channelTitle}
                  <CheckCircle className="text-blue-500 ml-1 text-xs" />
                </Link>
              </div>
            </div>

            {/* Video Stats */}
            <div className="flex flex-col text-right text-xs md:text-base text-gray-700">
              <div>{parseInt(viewCount).toLocaleString()} views</div>

              <div>{parseInt(likeCount).toLocaleString()} likes</div>

              <div>{parseInt(commentCount).toLocaleString()} comments</div>
            </div>
          </div>
          {description && (
            <div
              className="text-gray-700 mt-2 whitespace-pre-line 
              material-box 
              text-md w-full
              "
            >
              <p>{truncatedDescription}</p>

              <button
                className="text-blue-500 mt-2 cursor-pointer focus:outline-none"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                {isDescriptionExpanded ? "Show Less" : "Show More"}
              </button>
            </div>
          )}

          {/* {Show comment} */}
          <div
            className="text-gray-700 my-2 whitespace-pre-line 
              material-box 
              text-md w-full
              "
          >
            {!isShowComments && (
              <button
                className="text-blue-500 py-2 cursor-pointer focus:outline-none"
                onClick={() => {
                  !isShowComments && fetchComments();
                  setIsShowComments(true);
                }}
              >
                Show comments
              </button>
            )}

            {isShowComments && <Comments data={comments} />}
          </div>
        </div>
      </div>
      {/* Second Box */}
      <div
        className="justify-center items-center 
        lg:w-1/3 md:px-12"
      >
        {/* Button to show related videos */}
        {!isShowRelatedVideos && (
          <button
            className="text-blue-500 mt-2 cursor-pointer focus:outline-none px-6 py-8 md:text-xl justify-center w-full"
            onClick={fetchRelatedVideos}
          >
            Show more videos like this
          </button>
        )}
        {isShowRelatedVideos && (
          <>
            <div
              className="justify-center items-center mt-2 px-3
              text-2xl md:text-3xl font-bold py-5 text-red-700"
            >
              Related Video
            </div>
            <Videos direction="column" videos={relatedVideos} />
          </>
        )}
      </div>
    </div>
  );
};

export default VideoDetail;
