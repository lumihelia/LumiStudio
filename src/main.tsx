import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/tokens.css";
import "./styles/global.css";
import { AppStateProvider } from "./state/AppStateContext";
import { AuthGate } from "./components/auth/AuthGate";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthGate>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </AuthGate>
    </BrowserRouter>
  </StrictMode>
);
