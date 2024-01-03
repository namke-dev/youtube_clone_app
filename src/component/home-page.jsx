import { SideBar, Videos } from ".";
import { useEffect } from "react";
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

  // Handle realtime responsive for Videos component
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 640);
  const handleResize = () => {
    setIsWideScreen(window.innerWidth > 640);
  };
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  //pass category to searchTerm by url param
  useEffect(() => {
    if (selectedCategory) {
      console.log(`==>> /search/${selectedCategory}`);
      navigate(`/search/${selectedCategory}`);
    }
  }, [selectedCategory]);

  //Fetch data from searchTerm
  useEffect(() => {
    if (!searchTerm) return;
    console.log("Search term: " + searchTerm);

    const fetchData = async () => {
      startLoading();
      try {
        const regionCode = "VN";
        const maxResults = 20;
        const order = "relevance";
        const data = await fetchFromApi(
          `search?part=snippet,id&q=${encodeURI(
            searchTerm
          )}&regionCode=${regionCode}&maxResults=${maxResults}&order=${order}&pageToken=${nextpageToken}`
        );
        setNextPageToken(data.nextPageToken);
        setVideos(data.items);
      } catch (error) {
        console.log(error);
      } finally {
        stopLoading();
      }
    };

    fetchData();
  }, [searchTerm]);

  return (
    <div className="flex flex-col md:flex-row">
      {/* Side bar container */}
      <div
        className={`p-5
        h-auto 
        mr-5
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
      <div className="flex-wrap mx-1 md:overflow-y-auto md:h-[90vh]">
        <p className="text-gray-700 font-bold md:mt-2 mb-2 md:mb-5 text-3xl ml-5">
          {selectedCategory ? selectedCategory : searchTerm}{" "}
          <span className="text-blue-500">videos</span>
        </p>
        {/* I fix this later */}
        {isWideScreen ? (
          <Videos direction="row" videos={videos} />
        ) : (
          <Videos direction="column" videos={videos} />
        )}
      </div>
    </div>
  );
};

export default HomePage;
