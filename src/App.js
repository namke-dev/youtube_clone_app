import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import { VideoDetail, ChannelDetail, Header, HomePage } from "./component";
const App = () => (
  <BrowserRouter>
    <Box className="bg-gray-50">
      <Header />
      <Routes>
        <Route path="/" exact element={<HomePage />} />
        <Route path="/video/:id" element={<VideoDetail />} />
        <Route path="/channel/:id" element={<ChannelDetail />} />
        <Route path="/search/:searchTerm" element={<HomePage />} />
      </Routes>
    </Box>
  </BrowserRouter>
);

export default App;
