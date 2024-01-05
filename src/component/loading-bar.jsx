import React from "react";

export const LoadingBar = ({ isLoading }) => {
  return (
    <div
      className={`
        fixed
        transition-all 
        duration-500 !z-50
        h-0.5 bg-blue-900 opacity-90
      ${isLoading ? "w-full" : "w-0"} `}
    ></div>
  );
};
