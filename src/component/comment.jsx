import React from "react";
import { formatRelativeTime } from "../utils/utils";
import { HtmlContent } from "../utils/utils";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";

const Comment = ({ commentData }) => {
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
          <p className="published-date text-gray-500 text-xs">
            {formatRelativeTime(publishedAt)}
          </p>
          <HtmlContent
            className="comment-text text-gray-700 mt-2"
            content={textDisplay}
          />
          {likeCount > 0 && (
            <div>
              <ThumbUpIcon
                style={{
                  fontSize: "16px",
                  marginRight: "4px",
                  marginTop: "1px",
                }}
              />
              <span className="align-middle text-sm text-gray-600">
                {parseInt(likeCount).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comment;
