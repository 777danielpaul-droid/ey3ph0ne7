import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"
import { getInitialTheme, applyTheme } from "./lib/theme.js"

// Theme vor dem ersten Paint setzen (kein Flash).
applyTheme(getInitialTheme())

const root = document.getElementById("root")

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
