import { Search } from "@mui/icons-material";
import { Paper } from "@mui/material";
import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm !== "") {
      navigate(`/search/${searchTerm}`);
      // setSearchTerm("");
    } else {
      navigate(`/`);
    }
  };
  return (
    <Paper
      component="form"
      onSubmit={(e) => handleSubmit(e)}
      className="
        !rounded-full w-full 
        flex flex-row
        mx-0 py-2 pl-4 
        !shadow-inner !shadow-gray-200 
        !bg-white/70"
    >
      <input
        className="flex-grow focus:outline-none w-11/12 !bg-white/0"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <button type="submit" className="pr-4">
        <Search />
      </button>
    </Paper>
  );
};

export default SearchBar;
