import { SideBar, Videos } from ".";
import { useEffect, useRef } from "react";
import { fetchFromApi } from "../utils/fetchFromApi";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useLoading } from "../context/loading-context";

const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState("Kurzgesagt");
  const [videos, setVideos] = useState([]);
  const [nextpageToken, setNextPageToken] = useState("");

  const { startLoading, stopLoading } = useLoading();
  const { searchTerm } = useParams();

  const navigate = useNavigate();
  const feedContainerRef = useRef(null);

  const isMobile = window.innerWidth < 768;

  // Pass category to searchTerm by URL param
  useEffect(() => {
    if (selectedCategory) {
      console.log(`==>> /search/${selectedCategory}`);
      navigate(`/search/${selectedCategory}`);
    }
  }, [selectedCategory]);

  // Fetch more data when scrolling to the end
  const handleScrollLargeDivice = async () => {
    console.log("Start Handle scroll");

    const feedContainer = feedContainerRef.current;

    if (feedContainer) {
      const { scrollHeight, scrollTop, clientHeight } = feedContainer;

      if (scrollHeight - scrollTop <= clientHeight + 1) {
        // User has scrolled to the bottom
        console.log("User has scrolled to the bottom");
        await fetchData(true);
      }
    }
  };

  useEffect(() => {
    // Attach the scroll event listener
    const feedContainer = feedContainerRef.current;
    feedContainer.addEventListener("scroll", handleScrollLargeDivice);

    // Clean up the event listener when the component is unmounted
    return () => {
      feedContainer.removeEventListener("scroll", handleScrollLargeDivice);
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

  useEffect(() => {
    let isFetching = false;

    const handleScrollMobile = async () => {
      if (isFetching) {
        return;
      }

      // Check if the user has scrolled to the bottom of the page
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 100
      ) {
        console.log("User has scrolled to the bottom");

        isFetching = true; // Set the flag to true

        try {
          await fetchData(true);
        } catch (error) {
          console.error(error);
        } finally {
          isFetching = false; // Reset the flag whether the fetch is successful or not
        }
      }
    };

    // Attach the scroll event listener
    window.addEventListener("scroll", handleScrollMobile);

    // Clean up the event listener when the component is unmounted
    return () => {
      window.removeEventListener("scroll", handleScrollMobile);
    };
  }, [videos, nextpageToken]);

  return (
    <div
      className="
      flex 
      flex-col 
      md:flex-row 
      md:fixed md:top-0"
    >
      {/* Side bar container */}
      <div
        className={`
        md:mx-2
        md:pr-3
        md:pt-36
        pt-20
        mb-2
        
        h-auto
        md:h-[100vh]

        w-full
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

          flex flex-wrap 
          
          md:overflow-y-scroll
          md:h-[100vh] 
          md:w-full
          "
      >
        {!isMobile ? (
          <p className="text-pink-700 font-bold md:mt-2 mb-2 md:mb-5 text-3xl">
            <span className="text-gray-500"> Search term: </span>
            {searchTerm}
          </p>
        ) : (
          ""
        )}

        <Videos direction={!isMobile ? "row" : "column"} videos={videos} />
      </div>
    </div>
  );
};

export default HomePage;
