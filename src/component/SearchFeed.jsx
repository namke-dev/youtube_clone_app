import { SideBar, Videos } from "../component";
import { useEffect } from "react";
import { fetchFromApi } from "../utils/fetchFromApi";
import { useState } from "react";
import { useParams } from "react-router-dom";

const SearchFeed = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 640);

  useEffect(() => {
    fetchFromApi(
      `search?part=snippet,id&q=${selectedCategory}&regionCode=VN&order=date`
    ).then((data) => setVideos(data.items));

    const handleResize = () => {
      setIsWideScreen(window.innerWidth > 640);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [selectedCategory]);

  const { searchTerm } = useParams();
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetchFromApi(`search?part=snippet&q=${searchTerm}&regionCode=VN`).then(
      (data) => setVideos(data.items)
    );
  }, [searchTerm]);

  return (
    <div className="flex flex-col md:flex-row">
      <div
        className={`
        p-5
        h-auto 
        border-r border-solid border-gray-50 
        mr-5
        min-w-[12rem]
        md:w-[14rem]
        
        overflow-hidden 
        ${isWideScreen ? "" : "overflow-x-auto"}
        `}
      >
        <SideBar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div>

      <div
        className="h-90vh flex-wrap
        "
      >
        <p className="text-gray-700 font-bold mt-2 mb-4 mr-2 text-3xl ml-5">
          {selectedCategory} <span className="text-pink-500">Videos</span>
        </p>
        {isWideScreen ? (
          <Videos direction="row" videos={videos} />
        ) : (
          <Videos direction="column" videos={videos} />
        )}
      </div>
    </div>
  );
};

export default SearchFeed;
