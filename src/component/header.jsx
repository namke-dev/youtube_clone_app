import React from "react";
import { Link } from "react-router-dom";
import { logo } from "../utils/constants";
import SearchBar from "./search-bar";
import { useLoading } from "../context/loading-context";
import { LoadingBar } from "./loading-bar";
const Header = () => {
  const { isLoading } = useLoading();

  return (
    <>
      <LoadingBar isLoading={isLoading} />

      <div
        className="
      flex flex-col 
      sticky mt-1.5
      backdrop-blur-sm
      rounded-full 
      shadow
      z-50 
      md:mx-16
      mx-3
      pl-3
      pr-2
      py-2
  "
      >
        <div
          className="
            w-full flex 
            text-lg 
            text-gray-700
          "
        >
          {/* Logo on the left */}
          <Link to="/" className="flex items-center font-bold mr-10">
            <img src={logo} alt="logo" className="h-8 mx-3" />
            <span>DevTubes</span>
            <p className="text-xs font-thin ml-3 mr-4 w-auto">namke-dev</p>
          </Link>

          {/* Centered SearchBar */}
          <div className="flex items-center w-full">
            <div className="mx-auto w-full">
              <SearchBar />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
