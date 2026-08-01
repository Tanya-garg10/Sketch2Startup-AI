import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../lib/firebase";
import { Button } from "./ui/button";

const nav = ["dashboard", "upload", "projects", "prd", "architecture", "database", "apis", "frontend", "backend", "testing", "documentation", "settings"];

export function Layout() {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await signOut(firebaseAuth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#2e1065,transparent_35%),#050816]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-slate-950/70 p-5 md:block">
        <h1 className="mb-8 text-xl font-bold">
          <span className="text-cyan-400">Sketch</span>2Startup AI
        </h1>
        <nav className="space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n}
              to={`/${n}`}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2 capitalize ${isActive ? "bg-violet-600" : "hover:bg-white/10"}`
              }
            >
              {n}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 pt-4 border-t border-white/10">
          <Button
            onClick={handleLogout}
            className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-300"
          >
            Logout
          </Button>
        </div>
      </aside>
      <main className="md:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/60 p-4 backdrop-blur">
          <b>AI App Generator</b>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
              Groq + Tavily online
            </span>
            <span className="text-sm text-slate-400">
              {firebaseAuth.currentUser?.email}
            </span>
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
