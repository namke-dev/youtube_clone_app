import React, { useEffect, useState } from "react";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import GridViewOutlined from "@mui/icons-material/GridViewOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import BookmarkBorderOutlined from "@mui/icons-material/BookmarkBorderOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { fetchFromApi } from "../utils/fetchFromApi";
export const icons = {
  home: HomeOutlined,
  explore: GridViewOutlined,
  history: HistoryOutlined,
  saved: BookmarkBorderOutlined,
  search: SearchOutlined,
  play: PlayArrowOutlined,
  arrow: ArrowForwardRounded,
};
export function Icon({ name, ...props }) {
  const Component = icons[name] || icons.play;
  return <Component aria-hidden="true" {...props} />;
}
export const topics = [
  {
    name: "For you",
    query:
      "AI product building communication practical philosophy",
  },

  // Kinh doanh và xây sản phẩm
  {
    name: "Entrepreneurship",
    query:
      "entrepreneurship bootstrapping business case study",
  },
  {
    name: "Build & Sell",
    query:
      "customer discovery product validation SaaS marketing",
  },
  {
    name: "Personal Finance",
    query:
      "personal finance budgeting saving investing basics",
  },

  // Công nghệ và kỹ năng nghề nghiệp
  {
    name: "AI",
    query:
      "AI engineering agents evaluation practical projects",
  },
  {
    name: "Software Architecture",
    query:
      "system design dotnet distributed systems tradeoffs",
  },
  {
    name: "Apple",
    query:
      "Apple Mac iPhone reviews productivity",
  },

  // Tư duy và giao tiếp
  {
    name: "Communication",
    query:
      "assertive communication active listening difficult conversations",
  },
  {
    name: "Critical Thinking",
    query:
      "critical thinking evidence probability cognitive biases",
  },
  {
    name: "Stoicism",
    query:
      "Stoicism Epictetus Marcus Aurelius practical philosophy",
  },
  {
    name: "Consciousness",
    query:
      "consciousness neuroscience philosophy of mind",
  },

  // Kiến thức và học tập
  {
    name: "Physics",
    query:
      "physics explained intuition experiments",
  },
  {
    name: "History",
    query:
      "world history primary sources documentary",
  },
  {
    name: "Lessons",
    query:
      "learning how to learn deliberate practice worked examples",
  },
  {
    name: "English",
    query:
      "business English speaking presentations pronunciation",
  },
  {
    name: "Podcasts",
    query:
      "long form interviews science entrepreneurship philosophy",
  },

  // Giải trí và âm nhạc
  {
    name: "Markiplier",
    query: "Markiplier",
  },
  {
    name: "Playlists",
    query: "instrumental focus music playlist",
  },
  {
    name: "Mixes",
    query: "chill electronic ambient music mix",
  },
];
export function useResource(endpoint) {
  const [state, setState] = useState({
    data: null,
    loading: !!endpoint,
    error: null,
  });
  const [attempt, retry] = useState(0);
  useEffect(() => {
    let current = true;
    setState({ data: null, loading: !!endpoint, error: null });
    if (endpoint)
      fetchFromApi(endpoint)
        .then((data) => {
          if (current) setState({ data, loading: false, error: null });
        })
        .catch((error) => {
          if (current)
            setState({ data: null, loading: false, error: error.message });
        });
    return () => {
      current = false;
    };
  }, [endpoint, attempt]);
  return { ...state, retry: () => retry((n) => n + 1) };
}
export function Status({ loading, error, retry, empty = false }) {
  if (loading)
    return (
      <div className="skeleton-grid" role="status" aria-label="Loading videos">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div className="skeleton" key={n} />
        ))}
      </div>
    );
  if (error)
    return (
      <div className="empty-state" role="alert">
        <h2>A small pause.</h2>
        <p>{error}</p>
        <button className="button primary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  if (empty)
    return (
      <div className="empty-state">
        <h2>Nothing here yet.</h2>
        <p>Try another search or explore a different topic.</p>
      </div>
    );
  return null;
}
export const thumbnail = (item) =>
  item?.snippet?.thumbnails?.maxres?.url ||
  item?.snippet?.thumbnails?.high?.url ||
  item?.snippet?.thumbnails?.medium?.url ||
  item?.snippet?.thumbnails?.default?.url;
export function Thumbnail({ item, ...props }) {
  const [failed, setFailed] = useState(false);
  const src = thumbnail(item);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      {...props}
    />
  ) : (
    <div className="thumbnail-fallback" aria-hidden="true">
      <Icon name="play" />
    </div>
  );
}
export function formatCount(value) {
  return value === undefined
    ? null
    : new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(Number(value));
}
