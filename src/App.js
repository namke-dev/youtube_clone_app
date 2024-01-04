import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VideoDetail, ChannelDetail, Header, HomePage } from "./component";
import { LoadingProvider } from "./context/loading-context";
const App = () => (
  <BrowserRouter>
    <div>
      <div
        className="bg-sky-50 -z-10
          absolute top-[-6rem] right-[11rem] 
            h-[31.25rem] w-[31.25rem]
            rounded-full blur-[10rem] 
            sm:w-[68.75rem]"
      ></div>
      <div
        className="bg-gray-50 -z-10
            absolute top-[-1rem] left-[-35rem]
            h-[31.25rem] w-[50rem]
            rounded-full blur-[10rem] 
            sm:w-[68.75rem] md:left-[-33rem] lg:left-[-28rem] 
            xl:left-[-15rem] 2xl:left-[-5rem]
            "
      ></div>
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
