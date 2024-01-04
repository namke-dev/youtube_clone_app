import React from "react";

export const LoadingBar = ({ isLoading }) => {
  return (
    <div
      className={`transition-all duration-500 ${
        isLoading ? "w-full" : "w-0"
      } h-1 bg-red-700 opacity-60`}
    ></div>
  );
};
