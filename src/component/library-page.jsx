import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { readLibrary, clearLibrary, removeVideo } from "../utils/library";
import SideBar from "./side-bar";
import VideoCard from "./video-card";
export default function LibraryPage({ type }) {
  const [items, setItems] = useState(() => readLibrary(type));
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const update = () => setItems(readLibrary(type));
    update();
    window.addEventListener("devtubes-library", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("devtubes-library", update);
      window.removeEventListener("storage", update);
    };
  }, [type]);
  function clear() {
    if (
      window.confirm(
        `Clear all ${type === "saved" ? "saved videos" : "watch history"} on this device?`,
      )
    ) {
      if (!clearLibrary(type))
        setNotice("Could not clear storage. Please check browser permissions.");
    }
  }
  return (
    <div className="app-layout">
      <SideBar />
      <main id="main" className="feed">
        <div className="intro">
          <div>
            <h1>
              {type === "saved"
                ? "Your next great watch."
                : "A trail of curiosity."}
            </h1>
            <p>
              {type === "saved" ? "Saved videos" : "Watch history"} · Stored
              only in this browser, up to 100 videos.
            </p>
          </div>
          {items.length > 0 && (
            <button className="button" onClick={clear}>
              Clear {type === "saved" ? "saved videos" : "history"}
            </button>
          )}
        </div>
        <p role="status">{notice}</p>
        {!items.length ? (
          <div className="empty-state">
            <h2>
              {type === "saved"
                ? "Something worth coming back to."
                : "Your story starts here."}
            </h2>
            <p>
              {type === "saved"
                ? "Save a video from its watch page to find it here."
                : "Videos appear here after you start playback."}
            </p>
            <Link className="button primary" to="/">
              Discover videos
            </Link>
          </div>
        ) : (
          <div className="video-grid">
            {items.map((item) => (
              <div key={item.id}>
                <VideoCard video={item} />
                <button
                  className="text-button remove"
                  onClick={() => {
                    if (!removeVideo(type, item.id))
                      setNotice("Could not update browser storage.");
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
