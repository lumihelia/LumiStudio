import { PageShell } from "../components/layout/PageShell";
import { CaptureForm } from "../components/capture/CaptureForm";
import { RecentCapturesList } from "../components/capture/RecentCapturesList";
import styles from "./CapturePage.module.css";

export function CapturePage() {
  return (
    <PageShell>
      <div className={styles.heading}>
        <h1>收进来</h1>
        <p>看到什么、想到什么，先收进来，记一下为什么重要。回去电脑上再细想。</p>
      </div>
      <CaptureForm />
      <RecentCapturesList />
    </PageShell>
  );
}
