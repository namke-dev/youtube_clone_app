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
    <div className="flex flex-col md:flex-row fixed top-0">
      {/* Side bar container */}
      <div
        className={`
        md:mx-3
        md:pt-20
        md:mr-5
        md:mt-0        
        mt-20
        mb-2 mx-2
        
        
        h-auto
        md:h-[100vh]

        w-[100vw]
        md:w-auto

        md:overflow-y-auto
        overflow-x-auto

        md:overflow-visible
        overflow-hidden
        `}
      >
        <SideBar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div>

      {/* Feed container */}
      <div
        ref={feedContainerRef}
        className="
          sm:px-1 
          md:px-1
          lg:px-30
          xl:px-1
          2xl:px-1
          md:pt-20
          
          md:overflow-y-scroll
          
          md:h-[100vh] 
          h-auto
          
          flex flex-wrap 
          md:w-full
          "
      >
        {window.innerWidth > 768 ? (
          <p className="text-gray-700 font-bold md:mt-2 mb-2 md:mb-5 text-3xl">
            {searchTerm} <span className="text-red-800"> videos</span>
          </p>
        ) : (
          ""
        )}

        <Videos
          direction={window.innerWidth >= 768 ? "row" : "column"}
          videos={videos}
        />
      </div>
    </div>
  );
};

export default HomePage;
