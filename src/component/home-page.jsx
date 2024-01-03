import { SideBar, Videos } from ".";
import { useEffect } from "react";
import { fetchFromApi } from "../utils/fetchFromApi";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { LoadingBar } from "./loading-bar";

const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState("Conan");
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 768);
  const [isLoading, setIsLoading] = useState(false);

  const handleResize = () => {
    setIsWideScreen(window.innerWidth > 640);
  };

  const { searchTerm } = useParams();
  const [videos, setVideos] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    console.log(`==>> Navigate /search/${selectedCategory}`);
    if (selectedCategory) {
      navigate(`/search/${selectedCategory}`);
    }
  }, [selectedCategory]);

  useEffect(() => {
    const fetchData = async () => {
      if (!searchTerm) return;
      try {
        console.log("Search term: " + searchTerm);
        console.log("Before loading");
        setIsLoading(true);
        if (searchTerm) {
          const data = await fetchFromApi(
            `search?part=snippet,id&q=${searchTerm}&regionCode=VN`
          );
          setVideos(data.items);
        }
      } catch (error) {
        console.log(error);
      } finally {
        console.log("After loading");
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchTerm]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <LoadingBar isLoading={isLoading} />
      <div className="flex flex-col md:flex-row">
        {/* Side bar container */}

        <div
          className={`
        p-5
        h-auto 
        mr-5
        min-w-[12rem]
        md:w-[14rem]
        overflow-hidden
        ${
          isWideScreen
            ? "md:overflow-y-auto md:h-[90vh] md:overflow-hidden"
            : "overflow-x-auto"
        }
        `}
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
          {isWideScreen ? (
            <Videos direction="row" videos={videos} />
          ) : (
            <Videos direction="column" videos={videos} />
          )}
        </div>
      </div>
    </>
  );
};

export default HomePage;
