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
      className="pl-2 mr-5
        !rounded-full w-full 
        flex flex-row
        bg-none px-5 py-2
        !shadow"
    >
      <input
        className="flex-grow ml-5 focus:outline-none "
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <button type="submit" className="flex items-center">
        <Search />
      </button>
    </Paper>
  );
};

export default SearchBar;
