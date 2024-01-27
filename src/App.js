import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VideoDetail, ChannelDetail, Header, HomePage } from "./component";
import { LoadingProvider } from "./context/loading-context";
const App = () => (
  <BrowserRouter>
    <div>
      <LoadingProvider>
        <Header />
        <Routes>
          <Route path="/" exact element={<HomePage />} />
          <Route path="/video/:id" element={<VideoDetail />} />
          <Route path="/channel/:id" element={<ChannelDetail />} />
          <Route path="/search/:searchTerm" element={<HomePage />} />
        </Routes>
      </LoadingProvider>
    </div>
  </BrowserRouter>
);

export default App;
