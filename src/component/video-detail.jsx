import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { Link, useParams } from "react-router-dom";
import { fetchFromApi } from "../utils/fetchFromApi";
import { CheckCircle } from "@mui/icons-material";
import { Videos, Comments } from ".";
import { formatRelativeTime } from "../utils/utils";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { HtmlContent } from "../utils/utils";
import { scrollToTop } from "../utils/utils";
import { useLoading } from "../context/loading-context";

const VideoDetail = () => {
  const { id } = useParams();
  const [videoDetail, setVideoDetail] = useState(null);

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const [relatedVideos, setRelatedVideos] = useState(null);
  const [isShowRelatedVideos, setIsShowRelatedVideos] = useState(false);

  const [comments, setComments] = useState(null);
  const [isShowComments, setIsShowComments] = useState(false);

  const { startLoading, stopLoading } = useLoading();

  // Load related videos
  const fetchRelatedVideos = async () => {
    startLoading();

    const data = await fetchFromApi(
      `search?relatedToVideoId=${id}&part=id,snippet&type=video`
    );

    setRelatedVideos(data.items);
    setIsShowRelatedVideos(true);

    stopLoading();
  };

  // Load video
  const fetchData = async () => {
    startLoading();

    const data = await fetchFromApi(`videos?part=snippet,statistics&id=${id}`);
    setVideoDetail(data.items[0]);

    setIsShowComments(false);
    setIsShowRelatedVideos(false);
    setIsDescriptionExpanded(false);

    stopLoading();
    scrollToTop();
  };

  // Load comment
  const fetchComments = async () => {
    startLoading();

    const part = "snippet";
    const maxResults = "30";
    const data = await fetchFromApi(
      `commentThreads?videoId=${id}&part=${part}&maxResults=${maxResults}`
    );

    setComments(data.items);
    setIsShowComments(true);

    stopLoading();
  };

  useEffect(() => {
    if (!id) return;
    console.log(`Video id: ${id}`);
    fetchData();
    fetchRelatedVideos();
    fetchComments();
  }, [id]);

  if (!videoDetail) {
    return "";
  }

  const {
    snippet: { title, channelId, channelTitle, description, publishedAt },
    statistics: { viewCount, likeCount },
  } = videoDetail;

  const truncatedDescription =
    description && !isDescriptionExpanded
      ? description.split(" ").slice(0, 50).join(" ") + "..."
      : description;

  return (
    <div
      className="flex flex-col 
      lg:flex-row 
      h-[100%]
      max-w-[1600px]
      m-auto"
    >
      {/* First box */}
      <div
        className="flex-1
        pt-16
        md:pb-32
        md:mx-4
        lg:h-[100vh] lg:overflow-y-scroll lg:overflow-hidden
        "
      >
        <div
          className="mt-8 flex flex-col items-center 
          md:w-85% lg:mr-4 lg:ml-14 mx-1"
        >
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
          <div className="text-xl md:text-2xl md:mt-5 font-bold mt-2 text-left w-full">
            {title}
          </div>

          {/* Channel Details and Video Stats */}
          <div className="flex justify-between mt-2 w-full material-box">
            {/* Channel Details */}
            <div className="flex flex-col text-left">
              {/* Published Date */}
              <p className="text-xs md:text-sm text-gray-500">
                {formatRelativeTime(publishedAt)}
              </p>

              {/* Channel Title */}
              <div className="text-lg font-semibold md:text-xl text-gray-900  mt-2">
                <Link to={`/channel/${channelId}`}>
                  {channelTitle}
                  <CheckCircle className="text-blue-500 ml-1 text-xs" />
                </Link>
              </div>
            </div>

            {/* Video Stats */}
            <div className="flex flex-col text-right text-sm md:text-base text-gray-400">
              <div>
                <span className="align-middle">
                  {parseInt(viewCount).toLocaleString()}
                </span>
                <VisibilityIcon
                  style={{
                    fontSize: "16px",
                    marginLeft: "4px",
                    marginTop: "1px",
                  }}
                />
              </div>
              <div>
                <span className="align-middle">
                  {parseInt(likeCount).toLocaleString()}
                </span>
                <ThumbUpIcon
                  style={{
                    fontSize: "16px",
                    marginLeft: "4px",
                    marginTop: "1px",
                  }}
                />
              </div>
            </div>
          </div>

          {description && (
            <div
              className="text-gray-700 bg-gray-100 p-3 
              rounded-sm mt-2 
              whitespace-pre-line 
              text-sm w-full
              "
            >
              <p className="mb-2 text-base text-gray-800 font-semibold">
                Description
              </p>

              <HtmlContent content={truncatedDescription} />

              <button
                className="text-blue-500 mt-2 cursor-pointer focus:outline-none"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                {isDescriptionExpanded ? "Show Less" : "Show More"}
              </button>
            </div>
          )}

          {/* {Comments} */}
          <div
            className="text-gray-700 my-2 whitespace-pre-line 
              text-md w-full
              bg-gray-100 p-3 
              rounded-sm mt-2"
          >
            {/* Show comments btn */}
            {!isShowComments && (
              <button
                className="text-blue-500 py-2 cursor-pointer focus:outline-none"
                onClick={() => {
                  fetchComments();
                }}
              >
                Show comments
              </button>
            )}
            {isShowComments && <Comments data={comments} />}
          </div>
        </div>
      </div>

      {/* Related video*/}
      <div
        className="justify-center items-center 
        lg:h-[100vh] 
        lg:overflow-y-scroll lg:overflow-hidden
        lg:w-[29.5%] !xl:pl-8 
        pt-16
        md:pt-24"
      >
        {/* Button to show related videos */}
        {!isShowRelatedVideos && (
          <button
            className="text-blue-500 mt-2 cursor-pointer focus:outline-none px-6 py-8 md:text-xl text-left w-full"
            onClick={fetchRelatedVideos}
          >
            Show more videos like this
          </button>
        )}

        {isShowRelatedVideos && (
          <Videos
            direction={window.innerWidth >= 768 ? "column" : "row"}
            videos={relatedVideos}
          />
        )}
      </div>
    </div>
  );
};

export default VideoDetail;
