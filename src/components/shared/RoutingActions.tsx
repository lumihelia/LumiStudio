import { useState } from "react";
import type { Entry } from "../../data/types";
import { useAppState } from "../../state/useAppState";
import styles from "./RoutingActions.module.css";

interface RoutingActionsProps {
  entry: Entry;
  onDiscarded: () => void;
}

export function RoutingActions({ entry, onDiscarded }: RoutingActionsProps) {
  const { dispatch } = useAppState();
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const canPublish = entry.judgmentStatement.trim().length > 0;
  const canConnect = !!entry.projectTag;

  return (
    <div className={styles.group}>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.primary}
          disabled={!canPublish}
          onClick={() =>
            dispatch({
              type: "ROUTE_ENTRY",
              payload: { id: entry.id, destination: "published" },
            })
          }
        >
          放到公开页
        </button>
        <button
          type="button"
          className={styles.secondary}
          disabled={!canConnect}
          onClick={() =>
            dispatch({
              type: "ROUTE_ENTRY",
              payload: { id: entry.id, destination: "connected" },
            })
          }
        >
          连接到项目里
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={() =>
            dispatch({
              type: "ROUTE_ENTRY",
              payload: { id: entry.id, destination: "parked" },
            })
          }
        >
          先放着
        </button>
      </div>

      {!canPublish && (
        <p className={styles.hint}>先写一段判断，才能放到公开页</p>
      )}
      {!canConnect && (
        <p className={styles.hint}>先选一个项目，才能连接到项目里</p>
      )}

      <div className={styles.discardRow}>
        {confirmingDiscard ? (
          <>
            <span className={styles.confirmText}>这会把它从工作台里删掉，确定吗？</span>
            <button
              type="button"
              className={styles.confirmYes}
              onClick={() => {
                dispatch({ type: "DISCARD_ENTRY", payload: { id: entry.id } });
                onDiscarded();
              }}
            >
              确定不留了
            </button>
            <button
              type="button"
              className={styles.confirmNo}
              onClick={() => setConfirmingDiscard(false)}
            >
              再想想
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.discardLink}
            onClick={() => setConfirmingDiscard(true)}
          >
            不留了
          </button>
        )}
      </div>
    </div>
  );
}
