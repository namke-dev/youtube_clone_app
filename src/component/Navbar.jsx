import React from "react";
import { Link } from "react-router-dom";
import { logo } from "../utils/constants";
import SearchBar from "./SearchBar";
const Navbar = () => (
  <div
    className="
      w-full flex items-center p-2 
      sticky top-0 
      bg-sky-100 opacity-85 
      backdrop-blur-lg 
      text-lg shadow
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
);

export default Navbar;
