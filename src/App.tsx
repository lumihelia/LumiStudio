import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/layout/NavBar";
import { CapturePage } from "./routes/CapturePage";
import { WorkbenchPage } from "./routes/WorkbenchPage";
import { PublicPage } from "./routes/PublicPage";
import { AgentOutputPage } from "./routes/AgentOutputPage";
import styles from "./App.module.css";

function App() {
  return (
    <div className={styles.appShell}>
      <NavBar />
      <main className={styles.outlet}>
        <Routes>
          <Route path="/" element={<CapturePage />} />
          <Route path="/workbench" element={<WorkbenchPage />} />
          <Route path="/public" element={<PublicPage />} />
          <Route path="/agent" element={<AgentOutputPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
