import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { StoreProvider, ThemeProvider } from "./store.tsx";
import { App } from "./App.tsx";

const root = createRoot(document.getElementById("root")!);
root.render(
  <ThemeProvider>
    <StoreProvider>
      <App />
      <Analytics />
    </StoreProvider>
  </ThemeProvider>
);
