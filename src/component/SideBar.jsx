import React from "react";
import { categories } from "../utils/constants";

const SideBar = ({ selectedCategory, setSelectedCategory }) => (
  <div
    className="
    flex 
    flex-row
    md:flex-col 
    "
  >
    {categories.map((category) => (
      <button
        className={`
        group
        md:mt-3 py-2 px-3
        md:rounded-full
        rounded-xl
        md:ml-0
        mr-4
        min-w-[100px]
        bg-white
        border border-gray-100 border-solid
        font-semibold
        text-sm
        text-gray-600
        shadow-sm shadow-sky-300
        hover:bg-sky-200
        hover:text-gray-800
        items-center
        justify-center
        md:justify-start
        transition-all
        flex 
        md:flex-row 
        flex-col
        flex-wrap
        w-full
        ${
          category.name === selectedCategory
            ? "text-pink-800  bg-gradient-to-br from-orange-100 via-orange-200 to-pink-300"
            : ""
        }`}
        onClick={() => setSelectedCategory(category.name)}
        key={category.name}
      >
        <span
          className={`flex mr-2  ${
            category.name === selectedCategory ? "text-red-600" : ""
          }`}
        >
          {category.icon}
        </span>

        <span className="flex pt-[0.5]">{category.name}</span>
      </button>
    ))}
  </div>
);

export default SideBar;
