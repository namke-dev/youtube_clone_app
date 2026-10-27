import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Icon } from "./ui";
import { useAccount } from "../context/account-context";
export default function Header() {
  const { user } = useAccount();
  const accountName = user?.user_metadata?.full_name || user?.email || "Your account";
  const initial = Array.from(accountName.trim())[0]?.toUpperCase() || "?";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const input = useRef();
  const navigate = useNavigate();
  const location = useLocation();
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
      const shorts = location.pathname === "/shorts" || new URLSearchParams(location.search).get("format") === "shorts";
      navigate(`/search/${encodeURIComponent(query.trim())}${shorts ? "?format=shorts" : ""}`);
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
      <Link className="library-mark header-saved" to="/saved" aria-label="Open saved videos">
        <Icon name="saved" />
      </Link>
      <Link className="library-mark account-mark" to="/account" aria-label="Your account and favorite topics" title={user ? accountName : "Sign in and choose your topics"}>
        {user ? <span className="account-initial" aria-hidden="true">{initial}</span> : <Icon name="account" />}
      </Link>
    </header>
  );
}
