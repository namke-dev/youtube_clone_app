import React from "react";
import Comment from "./Comment";

export default function Comments({ data }) {
  if (!data) return null;

  return (
    <>
      <div>Comments</div>
      {data.map((commentData) => (
        <Comment key={commentData.id} commentData={commentData} />
      ))}
    </>
  );
}
