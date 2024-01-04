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
        w-auto 
        flex flex-row
        "
      >
        {/* Logo on the left */}
        <Link
          to="/"
          className="flex flex-row items-center text-gray-700 font-bold md:mr-10 md:w-[15rem]"
        >
          <img src={logo} alt="logo" className="h-10 mx-3 md:h-12" />
          {window.innerWidth > 768 ? (
            <div className="flex flex-col">
              <p>Dev-Tubes</p>
              <p className="text-xs font-thin ml-3 mr-4">namke-dev</p>
            </div>
          ) : (
            ""
          )}
        </Link>

        {/* Centered SearchBar */}
        <div className="flex items-center w-full">
          <div className="mx-auto w-full">
            <SearchBar />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
