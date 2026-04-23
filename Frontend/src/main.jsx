import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/config.js";
import App from "./App.jsx";
import { SidebarProvider } from "./context/SidebarContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import "./index.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <BrowserRouter>
          <SidebarProvider>
            <App />
          </SidebarProvider>
        </BrowserRouter>
      </LanguageProvider>
    </I18nextProvider>
  </StrictMode>,
)
