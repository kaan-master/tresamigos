import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { CateringCartProvider } from "./context/CateringCartContext";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LanguageProvider>
          <CateringCartProvider>
            <App />
          </CateringCartProvider>
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  const reloadKey = "ta-sw-reload";
  function reloadOnce() {
    if (sessionStorage.getItem(reloadKey) === "1") return;
    sessionStorage.setItem(reloadKey, "1");
    window.location.reload();
  }
  navigator.serviceWorker.addEventListener("controllerchange", reloadOnce);
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "tresamigos-reload") reloadOnce();
  });
  window.addEventListener("load", () => {
    window.setTimeout(() => sessionStorage.removeItem(reloadKey), 4000);
    void navigator.serviceWorker.register("/sw.js?v=3", { updateViaCache: "none" }).then((registration) => {
      void registration.update();
    }).catch(() => {
      /* offline cache is best-effort */
    });
  });
}
