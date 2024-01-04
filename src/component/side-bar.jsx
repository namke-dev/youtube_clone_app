import React from "react";
import { categories } from "../utils/constants";

const SideBar = ({ selectedCategory, setSelectedCategory }) => (
  <div
    className="
    flex 
    flex-row
    md:flex-col 
    my-1
    "
  >
    {categories.map((category) => (
      <button
        className={`
          group
        bg-white
          border border-gray-100 border-solid
          font-semibold
          text-sm
          text-gray-600
          shadow-sm shadow-sky-200
          hover:bg-sky-200
          hover:text-gray-800
          items-center
          justify-center
          transition-all
          flex
          
          md:mt-3 
          mt-1
          md:py-2
          py-1
          md:px-3
          px-1
          
          md:rounded-full
          rounded-xl
          md:ml-0
          mr-4
          min-w-[100px]
          md:flex-row
          md:justify-start

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
