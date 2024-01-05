import React from "react";

export const LoadingBar = ({ isLoading }) => {
  return (
    <div
      className={`
        fixed
        transition-all 
        duration-500 !z-50
        h-1 bg-red-800 opacity-90
      ${isLoading ? "w-full" : "w-0"} `}
    ></div>
  );
};
