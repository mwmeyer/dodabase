window.onerror = function(msg, url, lineNo, columnNo, error) {
  const errorContainer = document.createElement('div');
  errorContainer.style.position = 'fixed';
  errorContainer.style.top = '0';
  errorContainer.style.left = '0';
  errorContainer.style.right = '0';
  errorContainer.style.padding = '20px';
  errorContainer.style.background = 'red';
  errorContainer.style.color = 'white';
  errorContainer.style.zIndex = '9999';
  errorContainer.textContent = `DEBUG: ${msg}\nFile: ${url}\nLine: ${lineNo} - Column: ${columnNo}\nDetails: ${error?.toString()}`;
  document.body.appendChild(errorContainer);
  return false;
};

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
