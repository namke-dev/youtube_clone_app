import React from "react";
import Comment from "./comment";

export default function Comments({ data }) {
  if (!data) return null;

  return (
    <>
      <p className="mb-2 text-xl text-gray-800 font-semibold">Comments</p>{" "}
      {data.map((commentData) => (
        <Comment key={commentData.id} commentData={commentData} />
      ))}
    </>
  );
}
