import { SideBar, Videos } from "../component";
import { useEffect } from "react";
import { fetchFromApi } from "../utils/fetchFromApi";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const SearchFeed = () => {
  const [selectedCategory, setSelectedCategory] = useState("Conan");
  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 768);
  const handleResize = () => {
    setIsWideScreen(window.innerWidth > 640);
  };

  const { searchTerm } = useParams();
  const [videos, setVideos] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (selectedCategory) {
      navigate(`/search/${selectedCategory}`);
    }
  }, [selectedCategory, navigate]);

  useEffect(() => {
    if (searchTerm) {
      fetchFromApi(`search?part=snippet,id&q=${searchTerm}&regionCode=VN`).then(
        (data) => setVideos(data.items)
      );
    }
    if (searchTerm !== selectedCategory) {
      setSelectedCategory("");
    }
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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

      <div className="h-90vh flex-wrap mx-1">
        <p className="text-gray-700 font-bold md:mt-2 mb-2 md:mb-5 text-3xl ml-5">
          {selectedCategory ? selectedCategory : searchTerm}{" "}
          <span className="text-pink-500">Videos</span>
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
