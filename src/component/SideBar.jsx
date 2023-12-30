import { Stack } from "@mui/material";
import React from "react";
import { categories } from "../utils/constants";

const SideBar = ({ selectedCategory, setSelectedCategory }) => (
  <Stack>
    {categories.map((category) => (
      <button
        className={`
        group
        mt-3 py-2 px-3
        rounded-full
        bg-gray-50
        font-semibold
        text-sm
        text-gray-600
        shadow-gray-300
        shadow-sm
        hover:bg-red-50
        hover:text-pink-800
        items-center
        justify-start
        transition-all
        flex flex-row flex-wrap
        ${
          category.name === selectedCategory
            ? "text-pink-800  bg-gradient-to-br from-orange-100 via-orange-200 to-pink-300"
            : ""
        }`}
        onClick={() => setSelectedCategory(category.name)}
        key={category.name}
      >
        <span
          className={`flex mr-2 group-hover:text-red-800 ${
            category.name === selectedCategory ? "text-red-600" : ""
          }`}
        >
          {category.icon}
        </span>

        <span className="flex pt-[0.5]">{category.name}</span>
      </button>
    ))}
  </Stack>
);

export default SideBar;
