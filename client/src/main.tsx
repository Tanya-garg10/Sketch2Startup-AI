import React from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "./index.css"
import { Landing } from "./pages/Landing"
import { Auth } from "./pages/Auth"
import { AppLayout } from "./components/layout/AppLayout"
import { Dashboard } from "./pages/Dashboard"
import { Upload } from "./pages/Upload"
import { GeneratorPage } from "./pages/GeneratorPage"
import { PRDPage } from "./pages/PRDPage"
import { Settings } from "./pages/Settings"

const qc = new QueryClient()

/** Capitalise first letter only — handles "documentation" → "Documentation" */
function toTitle(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const generatorRoutes = [
  { path: "projects", title: "Projects" },
  { path: "architecture", title: "Architecture" },
  { path: "database", title: "Database" },
  { path: "apis", title: "Apis" },
  { path: "frontend", title: "Frontend" },
  { path: "backend", title: "Backend" },
  { path: "testing", title: "Testing" },
  { path: "documentation", title: "Documentation" },
]

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="upload" element={<Upload />} />
            <Route path="prd" element={<PRDPage />} />
            <Route path="settings" element={<Settings />} />
            {generatorRoutes.map(({ path, title }) => (
              <Route key={path} path={path} element={<GeneratorPage title={title} />} />
            ))}
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
