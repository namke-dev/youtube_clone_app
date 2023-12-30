import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import {
  Navbar,
  Feed,
  VideoDetail,
  ChannelDetail,
  SearchFeed,
} from "./component";
const App = () => (
  <BrowserRouter>
    <Box className="bg-vlack">
      <div
        className="bg-[#fbe2ea] -z-10
          absolute top-[-6rem] right-[11rem] 
            h-[31.25rem] w-[31.25rem]
            rounded-full blur-[10rem] 
            sm:w-[68.75rem]"
      ></div>
      <div
        className="bg-[#fbf3d7] -z-10
            absolute top-[-1rem] left-[-35rem]
            h-[31.25rem] w-[50rem]
            rounded-full blur-[10rem] 
            sm:w-[68.75rem] md:left-[-33rem] lg:left-[-28rem] 
            xl:left-[-15rem] 2xl:left-[-5rem]"
      ></div>
      <Navbar />
      <Routes>
        <Route path="/" exact element={<Feed />} />
        <Route path="/video/:id" element={<VideoDetail />} />
        <Route path="/channel/:id" element={<ChannelDetail />} />
        <Route path="/search/:searchTerm" element={<SearchFeed />} />
      </Routes>
    </Box>
  </BrowserRouter>
);

export default App;
