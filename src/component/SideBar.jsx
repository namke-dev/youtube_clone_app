import { Stack } from "@mui/material";
import React from "react";
import { categories } from "../utils/constants";

const SideBar = ({ selectedCategory, setSelectedCategory }) => (
  <Stack>
    {categories.map((category) => (
      <button
        className={`
        my-2 py-1 w-[100%] rounded-full
        border border-gray-200
        hover:bg-red-600
        transition-all
        ${
          category.name === selectedCategory
            ? "!bg-gray-100 text-red-600 border-red-600"
            : "!bg-gray-50 text-gray-600"
        }`}
        onClick={() => setSelectedCategory(category.name)}
        key={category.name}
      >
        <span
          className={`mr-2 ${
            category.name === selectedCategory
              ? "text-red-600"
              : "text-gray-600"
          }`}
        >
          {category.icon}
        </span>

        <span>{category.name}</span>
      </button>
    ))}
  </Stack>
);

export default SideBar;
