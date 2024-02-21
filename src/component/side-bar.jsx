import React from "react";
import { categories } from "../utils/constants";

const SideBar = ({ selectedCategory, setSelectedCategory }) => (
  <div
    className="
    flex 
    flex-row
    md:flex-col 
    md:my-1
    md:pb-32
    gap-2
    md:gap-1
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
          
          mt-0
          md:py-2
          py-1
          md:px-3
          px-1
          mb-1
          md:ml-0
          md:mr-7
          
          flex
          flex-row
          flex-wrap

          md:justify-start

          min-w-[100px]
          md:w-[11.5rem]
        ${
          category.name === selectedCategory
            ? "text-pink-700  shadow-inner shadow-gray-300"
            : "shadow-sm shadow-gray-300"
        }`}
        onClick={() => setSelectedCategory(category.name)}
        key={category.name}
      >
        {window.innerWidth >= 768 ? (
          <div
            className={`flex mr-2  ${
              category.name === selectedCategory ? "text-red-600" : ""
            }`}
          >
            {category.icon}
          </div>
        ) : (
          ""
        )}
        <div className="flex pt-[0.5] md:text-left font-semibold">
          {category.name}
        </div>
      </button>
    ))}
  </div>
);

export default SideBar;
