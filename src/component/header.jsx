import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "./ui";
export default function Header() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const input = useRef();
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  function search(e) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search/${encodeURIComponent(query.trim())}`);
      setOpen(false);
      input.current?.blur();
    }
  }
  return (
    <header className={`header ${open ? "search-open" : ""}`}>
      <Link className="brand" to="/" aria-label="Dev Tubes home">
        <span className="brand-mark">
          <Icon name="play" />
        </span>
        <span>devtubes</span>
      </Link>
      <form className="search" onSubmit={search} role="search">
        <Icon name="search" />
        <input
          ref={input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos, creators, ideas"
          aria-label="Search videos"
          maxLength={150}
        />
        <button type="submit" aria-label="Submit search">
          <span className="keyboard">↵</span>
        </button>
      </form>
      <span className="header-note">A little less noise.</span>
      <button
        className="mobile-search icon-button"
        aria-label={open ? "Close search" : "Open search"}
        onClick={() => {
          setOpen(!open);
          setTimeout(() => input.current?.focus(), 0);
        }}
      >
        <Icon name="search" />
      </button>
      <Link className="library-mark" to="/saved" aria-label="Open saved videos">
        <Icon name="saved" />
      </Link>
    </header>
  );
}
