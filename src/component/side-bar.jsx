import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Icon, topics } from "./ui";
const links = [
  ["/", "Discover", "home"],
  ["/explore", "Explore", "explore"],
  ["/history", "History", "history"],
  ["/saved", "Saved videos", "saved"],
];
export default function SideBar() {
  return (
    <>
      <aside className="sidebar">
        <nav aria-label="Main navigation">
          {links.map(([to, label, icon]) => (
            <NavLink end key={to} to={to}>
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <Link className="account-link" to="/account"><Icon name="account"/>Your account & topics</Link>
        <p className="eyebrow topic-label">Explore topics</p>
        <div className="topic-links">
          {topics.slice(1).map((t) => (
            <Link key={t.name} to={`/topic/${t.name.toLowerCase()}`}>
              {t.name}
            </Link>
          ))}
        </div>
        <div className="sidebar-note">
          A little less noise.
          <br />
          <span>A lot more possibility.</span>
        </div>
      </aside>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {links.map(([to, label, icon]) => (
          <NavLink end key={to} to={to}>
            <Icon name={icon} />
            <span>{label === "Saved videos" ? "Saved" : label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
