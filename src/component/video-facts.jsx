import React from 'react';
import { durationLabel, publishedLabel } from '../utils/video-metadata';

export default function VideoFacts({ video, showUnknown = false }) {
  const date = publishedLabel(video);
  const duration = durationLabel(video);
  if (!date && !duration && !showUnknown) return null;
  return <div className="video-facts">
    {duration ? <span>{duration}</span> : showUnknown && <span>Duration unavailable</span>}
    {date ? <time dateTime={video.snippet.publishedAt}>{date}</time> : showUnknown && <span>Date unavailable</span>}
  </div>;
}
