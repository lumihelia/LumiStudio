import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppState } from "../../state/useAppState";
import styles from "./NavBar.module.css";

const LINKS = [
  { to: "/", label: "收进来" },
  { to: "/workbench", label: "操作台" },
  { to: "/public", label: "公开页" },
  { to: "/agent", label: "给 agent 看" },
];

export function NavBar() {
  const { dispatch } = useAppState();
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <span className={styles.wordmark}>LumiStudio</span>
        <nav className={styles.links}>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.linkActive}` : styles.link
              }
            >
              {link.label}
            </NavLink>
          ))}
          {confirmingReset ? (
            <span className={styles.resetConfirm}>
              清空现在的改动？
              <button
                type="button"
                className={styles.resetConfirmYes}
                onClick={() => {
                  dispatch({ type: "RESET_TO_SEED" });
                  setConfirmingReset(false);
                }}
              >
                确定
              </button>
              <button
                type="button"
                className={styles.resetConfirmNo}
                onClick={() => setConfirmingReset(false)}
              >
                算了
              </button>
            </span>
          ) : (
            <button
              type="button"
              className={styles.reset}
              onClick={() => setConfirmingReset(true)}
            >
              恢复成示例数据
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
