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
      <div
        className="
        pt-12 h-auto 
        border-r border-solid border-gray-50 
        mr-5 px-5 w-[13rem]
        bg-white/30
        min-w-[12rem]"
      >
        <SideBar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div>

      <div className="h-90vh flex-wrap">
        <p className="text-gray-700 font-bold mt-2 mb-4 mr-2 text-3xl">
          {selectedCategory} <span className="text-pink-500">Videos</span>
        </p>
        <Videos direction="row" videos={videos} />
      </div>
    </div>
  );
};

export default Feed;
