import { useState } from "react";
import { NavLink } from "react-router-dom";
import styles from "./NavBar.module.css";

const LINKS = [
  { to: "/workbench", label: "工作台", icon: "01" },
  { to: "/gravity", label: "引力台", icon: "02" },
  { to: "/public", label: "公开页", icon: "03" },
  { to: "/agent", label: "Feed", icon: "04" },
];

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand} aria-label="回到收进来">
          <span className={styles.logoMark} aria-hidden="true" />
          <span className={styles.wordmark}>LumiLens</span>
          <span className={styles.tagline}>让思考被看见，让判断可沉淀</span>
        </NavLink>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="切换导航"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          导航
        </button>
        <nav className={menuOpen ? `${styles.links} ${styles.linksOpen}` : styles.links}>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => {
                return isActive ? `${styles.link} ${styles.linkActive}` : styles.link;
              }}
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.navIcon} aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
