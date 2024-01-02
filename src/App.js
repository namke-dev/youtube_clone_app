import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import { Navbar, VideoDetail, ChannelDetail, SearchFeed } from "./component";
const App = () => (
  <BrowserRouter>
    <Box className="bg-gray-100">
      <Navbar />
      <Routes>
        <Route path="/" exact element={<SearchFeed />} />
        <Route path="/video/:id" element={<VideoDetail />} />
        <Route path="/channel/:id" element={<ChannelDetail />} />
        <Route path="/search/:searchTerm" element={<SearchFeed />} />
      </Routes>
    </Box>
  </BrowserRouter>
);

export default App;
