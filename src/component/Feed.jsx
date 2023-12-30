import React, { useEffect } from "react";
import { SideBar, Videos } from "../component";
import { fetchFromApi } from "../utils/fetchFromApi";
import { useState } from "react";

const Feed = () => {
  const [selectedCategory, setSelectedCategory] = useState("New");
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetchFromApi(`search?part=snippet&q=${selectedCategory}`).then((data) =>
      setVideos(data.items)
    );
  }, [selectedCategory]);

  return (
    <div className="flex flex-col md:flex-row">
      <div className="mt-12 h-auto border-r border-solid border-gray-200 mr-16 px-5 w-[13rem]">
        <SideBar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div>

      <div className="p-2 h-90vh">
        <p className="text-black font-bold mt-2 mb-4 text-4xl">
          {selectedCategory} <span className="text-red-600">Videos</span>
        </p>
        {/* <Videos direction="row" videos={videos} /> */}
      </div>
    </div>
  );
};

export default Feed;
