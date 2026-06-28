import type { ReactNode } from "react";
import styles from "./PageShell.module.css";

interface PageShellProps {
  children: ReactNode;
  wide?: boolean;
}

export function PageShell({ children, wide = false }: PageShellProps) {
  return (
    <div className={wide ? styles.shellWide : styles.shell}>
      {children}
    </div>
  );
}
