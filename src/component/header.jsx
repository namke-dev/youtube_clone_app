import React from "react";
import { Link } from "react-router-dom";
import { logo } from "../utils/constants";
import SearchBar from "./search-bar";
import { useLoading } from "../context/loading-context";
import { LoadingBar } from "./loading-bar";
const Header = () => {
  const { isLoading } = useLoading();

  return (
    <div className="flex flex-col sticky top-1.5 mx-16 backdrop-blur-xl rounded-xl z-50 mb-5">
      <div
        className="
        w-full flex 
        p-2 
        text-lg 
        "
      >
        {/* Logo on the left */}
        <Link to="/" className="flex items-center font-bold mr-10">
          <img src={logo} alt="logo" className="h-8 mx-3" />
          <span>DevTubes</span>
          <p className="text-xs font-thin ml-2">namke-dev</p>
        </Link>

        {/* Centered SearchBar */}
        <div className="flex items-center w-full">
          <div className="mx-auto w-full">
            <SearchBar />
          </div>
        </div>
      </div>
      <LoadingBar isLoading={isLoading}></LoadingBar>
    </div>
  );
};

export default Header;
