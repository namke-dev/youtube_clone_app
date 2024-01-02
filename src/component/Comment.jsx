import React, { useState } from "react";

const Comment = ({ commentData }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const {
    snippet: {
      topLevelComment: {
        snippet: {
          textDisplay,
          authorDisplayName,
          authorProfileImageUrl,
          authorChannelUrl,
          likeCount,
          publishedAt,
        },
      },
    },
  } = commentData;

  return (
    <div className=" px-4 py-3 mb-4">
      <div className="flex items-center">
        <img
          src={authorProfileImageUrl}
          alt="Author Profile"
          className="rounded-full h-10 w-10 mr-3"
        />
        <div className="author-details">
          <a
            href={authorChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="author-name text-gray-800 font-semibold hover:underline"
          >
            {authorDisplayName}
          </a>
          <p className="published-date text-gray-500">{publishedAt}</p>
        </div>
      </div>
      <p className="comment-text text-gray-700 mt-2">{textDisplay}</p>
      {likeCount > 0 && (
        <div className="comment-actions flex items-center mt-2">
          <span className="text-gray-700">{`${likeCount} likes`}</span>
        </div>
      )}
    </div>
  );
};

export default Comment;
