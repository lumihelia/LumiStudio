import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppState } from "../../state/useAppState";
import styles from "./NavBar.module.css";

const LINKS = [
  { to: "/", label: "收进来", desktopOnly: false },
  { to: "/workbench", label: "操作台", desktopOnly: true },
  { to: "/public", label: "公开页", desktopOnly: false },
  { to: "/agent", label: "给 agent 看", desktopOnly: true },
];

export function NavBar() {
  const { dispatch } = useAppState();
  const [confirmingClear, setConfirmingClear] = useState(false);

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <span className={styles.wordmark}>LumiStudio</span>
        <nav className={styles.links}>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => {
                const base = link.desktopOnly ? `${styles.link} ${styles.desktopOnly}` : styles.link;
                return isActive ? `${base} ${styles.linkActive}` : base;
              }}
            >
              {link.label}
            </NavLink>
          ))}
          {confirmingClear ? (
            <span className={styles.resetConfirm}>
              清空所有材料？这会删掉你收进来的全部东西。
              <button
                type="button"
                className={styles.resetConfirmYes}
                onClick={() => {
                  dispatch({ type: "CLEAR_ALL" });
                  setConfirmingClear(false);
                }}
              >
                确定
              </button>
              <button
                type="button"
                className={styles.resetConfirmNo}
                onClick={() => setConfirmingClear(false)}
              >
                算了
              </button>
            </span>
          ) : (
            <button
              type="button"
              className={styles.reset}
              onClick={() => setConfirmingClear(true)}
            >
              清空全部
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
