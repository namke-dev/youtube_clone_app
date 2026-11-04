import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Icon, topics } from "./ui";
const links = [
  ["/", "Today", "home"],
  ["/explore", "Explore", "explore"],
  ["/shorts", "Shorts", "shorts"],
  ["/history", "History", "history"],
  ["/saved", "Saved videos", "saved"],
];
export default function SideBar() {
  return (
      <aside className="sidebar">
        <nav aria-label="Main navigation">
          {links.map(([to, label, icon]) => (
            <NavLink end key={to} to={to}>
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <p className="topic-label">Widen your world</p>
        <div className="topic-links">
          {['AI', 'Landscapes', 'Culture & Food', 'World & Science', 'History', 'Critical Thinking'].map(name => topics.find(t => t.name === name)).filter(Boolean).map((t) => (
            <Link key={t.name} to={`/topic/${encodeURIComponent(t.name.toLowerCase())}`}>
              {t.name}
            </Link>
          ))}
          <Link className="all-topics" to="/explore">All topics <Icon name="arrow" /></Link>
        </div>
        <div className="sidebar-note">
          A little less noise.
          <br />
          <span>A lot more possibility.</span>
        </div>
      </aside>

  );
}

export function MobileNavigation() {
  return (
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {links.map(([to, label, icon]) => (
          <NavLink end key={to} to={to}>
            <Icon name={icon} />
            <span>{label === "Saved videos" ? "Saved" : label}</span>
          </NavLink>
        ))}
      </nav>
  );
}
