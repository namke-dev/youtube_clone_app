import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";
import Header from "./component/header";
import HomePage from "./component/home-page";
import VideoDetail from "./component/video-detail";
import ChannelDetail from "./component/channel-detail";
import LibraryPage from "./component/library-page";
function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Dev Tubes — A little less noise";
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollReset />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<HomePage />} />
        <Route path="/topic/:topic" element={<HomePage />} />
        <Route path="/search/:searchTerm" element={<HomePage />} />
        <Route path="/video/:id" element={<VideoDetail />} />
        <Route path="/channel/:id" element={<ChannelDetail />} />
        <Route path="/saved" element={<LibraryPage type="saved" />} />
        <Route path="/history" element={<LibraryPage type="history" />} />
        <Route
          path="*"
          element={
            <main id="main" className="empty-state">
              <h1>This page wandered off.</h1>
              <Link className="button primary" to="/">
                Back to Discover
              </Link>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
