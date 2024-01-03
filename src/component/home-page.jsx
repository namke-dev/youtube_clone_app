import { SideBar, Videos } from ".";
import { useEffect, useRef } from "react";
import { fetchFromApi } from "../utils/fetchFromApi";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useLoading } from "../context/loading-context";

const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState("Conan");
  const [videos, setVideos] = useState([]);
  const [nextpageToken, setNextPageToken] = useState("");

  const { startLoading, stopLoading } = useLoading();
  const { searchTerm } = useParams();

  const navigate = useNavigate();
  const feedContainerRef = useRef(null);

  // Pass category to searchTerm by URL param
  useEffect(() => {
    if (selectedCategory) {
      console.log(`==>> /search/${selectedCategory}`);
      navigate(`/search/${selectedCategory}`);
    }
  }, [selectedCategory]);

  // Fetch more data when scrolling to the end
  const handleScroll = async () => {
    const feedContainer = feedContainerRef.current;
    if (feedContainer) {
      const { scrollHeight, scrollTop, clientHeight } = feedContainer;

      // Use a small threshold to account for floating-point precision issues
      const threshold = 1;

      if (scrollHeight - scrollTop <= clientHeight + threshold) {
        // User has scrolled to the bottom
        console.log("User has scrolled to the bottom");
        await fetchData(true);
      }
    }
  };

  useEffect(() => {
    // Attach the scroll event listener
    const feedContainer = feedContainerRef.current;
    feedContainer.addEventListener("scroll", handleScroll);

    // Clean up the event listener when the component is unmounted
    return () => {
      feedContainer.removeEventListener("scroll", handleScroll);
    };
  }, [videos, nextpageToken]);

  // Fetch data from searchTerm
  const fetchData = async (loadMore = false) => {
    startLoading();
    try {
      const regionCode = "VN";
      const maxResults = 48;
      const order = "relevance";
      const data = await fetchFromApi(
        `search?part=snippet,id&q=${encodeURI(
          searchTerm
        )}&regionCode=${regionCode}&maxResults=${maxResults}&order=${order}&pageToken=${
          loadMore ? nextpageToken : ""
        }`
      );

      if (loadMore) {
        // Append the new videos to the existing ones
        setVideos((prevVideos) => [...prevVideos, ...data.items]);
      } else {
        // Replace existing videos with new data
        setVideos(data.items);
      }

      setNextPageToken(data.nextPageToken);
    } catch (error) {
      console.error(error);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    if (searchTerm) fetchData();
  }, [searchTerm]);

  return (
    <div className="flex flex-col md:flex-row">
      {/* Side bar container */}
      <div
        className={`
        md:mx-3
        mb-2 mx-2
        h-auto 
        md:mr-5
        min-w-[12rem]
        md:w-[14rem]
        overflow-hidden
        md:overflow-y-auto md:h-[90vh]
        overflow-x-auto`}
      >
        <SideBar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div>

      {/* Feed container */}
      <div
        ref={feedContainerRef}
        className="flex-wrap mx-1 overflow-y-auto overflow-hidden h-[90vh]"
      >
        {window.innerWidth > 640 ? (
          <p className="text-gray-700 font-bold md:mt-2 mb-2 md:mb-5 text-3xl ml-5">
            {searchTerm} <span className="text-red-800"> videos</span>
          </p>
        ) : (
          ""
        )}

        <Videos direction="row" videos={videos} />
      </div>
    </div>
  );
};

export default HomePage;
