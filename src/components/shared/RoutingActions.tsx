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
      <div className={styles.header}>
        <span>最后流向</span>
        <p>关键动作需要你确认。</p>
      </div>
      <div className={styles.grid}>
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
          接到项目里
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

        {confirmingDiscard ? (
          <div className={styles.discardConfirm}>
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
          </div>
        ) : (
          <button
            type="button"
            className={styles.discard}
            onClick={() => setConfirmingDiscard(true)}
          >
            不留了
          </button>
        )}
      </div>

      {(!canPublish || !canConnect) && (
        <div className={styles.hints}>
          {!canPublish && <p className={styles.hint}>先写一段判断，才能放到公开页</p>}
          {!canConnect && <p className={styles.hint}>先选一个项目，才能连接到项目里</p>}
        </div>
      )}
    </div>
  );
}
