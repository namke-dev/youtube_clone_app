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
    <div className="comment-container bg-white/80 rounded-xl px-4 py-3 mb-4 shadow-md">
      <div className="author-info flex items-center">
        <img
          src={authorProfileImageUrl}
          alt="Author Profile"
          className="profile-image rounded-full h-10 w-10 mr-3"
        />
        <div className="author-details">
          <a
            href={authorChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="author-name text-blue-500 hover:underline"
          >
            {authorDisplayName}
          </a>
          <p className="published-date text-gray-500">{publishedAt}</p>
        </div>
      </div>
      <p className="comment-text text-gray-700 mt-2">{textDisplay}</p>
      <div className="comment-actions flex items-center mt-2">
        <span className="text-gray-700">{`${likeCount} likes`}</span>
        {/* Add more actions if needed */}
      </div>
    </div>
  );
};

export default Comment;
