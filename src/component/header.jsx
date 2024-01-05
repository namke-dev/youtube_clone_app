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

      {/* Header container */}
      <div
        className="
          fixed
          flex items-center
          mt-1.5
          ml-[7vw]
          p-3
          w-[86vw]
          backdrop-blur-xl
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
    </>
  );
};

export default Header;
