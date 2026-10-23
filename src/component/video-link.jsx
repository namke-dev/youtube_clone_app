import React from "react";
import { Link } from "react-router-dom";
import { readAutoFullscreen, requestVideoFullscreen } from "../utils/playback";

export default function VideoLink({ onClick, target, ...props }) {
  function openVideo(event) {
    onClick?.(event);
    if (!event.defaultPrevented && event.button === 0 &&
        !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey &&
        (!target || target === "_self") && readAutoFullscreen()) {
      void requestVideoFullscreen();
    }
  }
  return <Link {...props} target={target} onClick={openVideo} />;
}
