import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.jsx";

export default function Root() {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<Root />);
}
