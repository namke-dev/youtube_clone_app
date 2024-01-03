import React from "react";
import { Link } from "react-router-dom";
import { logo } from "../utils/constants";
import SearchBar from "./search-bar";
import { useLoading } from "../context/loading-context";
import { LoadingBar } from "./loading-bar";
const Header = () => {
  const { isLoading } = useLoading();

  return (
    <div className="fex fex-col sticky top-0">
      <div
        className="
      w-full flex items-center p-2 
      bg-white opacity-85 
      text-lg 
      shadow
      z-50"
      >
        {/* Logo on the left */}
        <Link to="/" className="flex items-center font-bold">
          <img src={logo} alt="logo" className="h-8 mx-3" />
          <span>DevTubes</span>
        </Link>

        {/* Centered SearchBar */}
        <div className="flex items-center w-full">
          <div className="mx-auto w-2/3">
            <SearchBar />
          </div>
        </div>
      </div>
      <LoadingBar isLoading={isLoading}></LoadingBar>
    </div>
  );
};

export default Header;
