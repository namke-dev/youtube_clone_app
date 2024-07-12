import React from "react";
import { Link } from "react-router-dom";
import { logo } from "../utils/constants";
import SearchBar from "./search-bar";
import { useLoading } from "../context/loading-context";
import { LoadingBar } from "./loading-bar";

const Header = () => {
  const { isLoading } = useLoading();

  return (
    <div className="w-full flex justify-center">
      <LoadingBar isLoading={isLoading} />
      <div
        className="
          fixed
          flex items-center
          mt-1.5
          p-3
          
          w-[86vw]
          max-w-[1000px]
          bg-gray-200/85
          rounded-full 
          shadow
          z-50 
        "
      >
        {/* Logo on the left */}
        <Link
          to="/"
          className="flex items-center text-gray-700 font-bold md:mr-10"
        >
          <img src={logo} alt="logo" className="h-10 md:h-12" />
          {window.innerWidth > 768 && (
            <div className="flex flex-col ml-3">
              <p>Dev-Tubes</p>
              <p className="text-xs font-thin">namke-dev</p>
            </div>
          )}
        </Link>

        {/* Centered SearchBar */}
        <div className="flex-grow">
          <SearchBar />
        </div>
      </div>
    </div>
  );
};

export default Header;
