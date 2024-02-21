import React from "react";
import { categories } from "../utils/constants";

const SideBar = ({ selectedCategory, setSelectedCategory }) => (
  <div
    className="
    flex 
    flex-row
    md:flex-col 
    md:my-1
    pb-32
    "
  >
    {categories.map((category) => (
      <button
        className={`
          group
          border-gray-200 border-b
          font-semibold
          text-sm
          rounded-xl

          text-gray-600
          hover:bg-gray-100
          hover:text-gray-800

          items-center
          justify-center
          transition-all
          
          md:mt-3 
          mt-0
          md:py-2
          py-1
          md:px-3
          px-1
          mb-1
          md:ml-0
          md:mr-7
          
          flex
          flex-col
          flex-wrap



          md:flex-row
          md:justify-start

          min-w-[100px]
          md:w-[9rem]
        ${
          category.name === selectedCategory
            ? "text-pink-700  shadow-inner shadow-gray-300"
            : "shadow-sm shadow-gray-300"
        }`}
        onClick={() => setSelectedCategory(category.name)}
        key={category.name}
      >
        <span className="flex pt-[0.5] text-left font-bold">
          {category.name}
        </span>
      </button>
    ))}
  </div>
);

export default SideBar;
