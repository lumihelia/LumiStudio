import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/layout/NavBar";
import { CapturePage } from "./routes/CapturePage";
import { WorkbenchPage } from "./routes/WorkbenchPage";
import { PublicPage } from "./routes/PublicPage";
import { AgentOutputPage } from "./routes/AgentOutputPage";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<CapturePage />} />
        <Route path="/workbench" element={<WorkbenchPage />} />
        <Route path="/public" element={<PublicPage />} />
        <Route path="/agent" element={<AgentOutputPage />} />
      </Routes>
    </>
  );
}

export default App;
