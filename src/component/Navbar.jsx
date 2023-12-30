import React from "react";
import { Link } from "react-router-dom";
import { logo } from "../utils/constants";
import SearchBar from "./SearchBar";
const Navbar = () => (
  <div
    className="
      flex flex-row p-2 
      sticky top-0 
      bg-white/40 
      backdrop-blur-xl 
      justify-between items-center 
      text-lg shadow-md"
  >
    <Link to="/" className="flex items-center font-bold">
      <img src={logo} alt="logo" className="h-8 mx-3" />
      <span>DevTube</span>
    </Link>

    <div className="flex-grow mx-4 items-center">
      <SearchBar className="w-full" />
    </div>
  </div>
);

export default Navbar;
