import { PageShell } from "../components/layout/PageShell";
import { CaptureForm } from "../components/capture/CaptureForm";
import { MobileCaptureExperience } from "../components/capture/MobileCaptureExperience";
import { RecentCapturesList } from "../components/capture/RecentCapturesList";
import styles from "./CapturePage.module.css";

export function CapturePage() {
  return (
    <>
      <div className={styles.desktopCapture}>
        <PageShell>
          <div className={styles.heading}>
            <p className={styles.kicker}>轻量收集层</p>
            <h1>先收进来。</h1>
            <p>这里不做完整工作台。看到、想到、只记得一点线索，都先留下来，回到电脑上再捋。</p>
          </div>
          <CaptureForm />
          <RecentCapturesList />
        </PageShell>
      </div>
      <div className={styles.mobileCapture}>
        <MobileCaptureExperience />
      </div>
    </>
  );
}
