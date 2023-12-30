import React from "react";
import { Link } from "react-router-dom";
import { logo } from "../utils/constants";
import SearchBar from "./SearchBar";
const Navbar = () => (
  <div
    className="flex items-center p-2 
    sticky top-0 
    bg-white/40
    backdrop-blur-xl 
    justify-between
    text-lg"
  >
    <Link to="/" className="flex items-center font-bold">
      <img src={logo} alt="logo" className="h-[3rem] mx-3" />
      DevTube
    </Link>
    <SearchBar className="flex" />
  </div>
);

export default Navbar;
