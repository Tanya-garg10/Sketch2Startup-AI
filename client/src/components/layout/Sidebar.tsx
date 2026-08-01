import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Upload,
  FileText,
  Layers,
  Database,
  Code2,
  TestTube2,
  BookOpen,
  Settings,
  Sparkles,
  FolderKanban,
  Server,
} from "lucide-react"
import { cn } from "../../lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Upload Sketch", href: "/upload", icon: Upload },
  { name: "PRD", href: "/prd", icon: FileText },
  { name: "Architecture", href: "/architecture", icon: Layers },
  { name: "Database", href: "/database", icon: Database },
  { name: "API Generator", href: "/apis", icon: Code2 },
  { name: "Frontend", href: "/frontend", icon: Sparkles },
  { name: "Backend", href: "/backend", icon: Server },
  { name: "Testing", href: "/testing", icon: TestTube2 },
  { name: "Documentation", href: "/documentation", icon: BookOpen },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-700/50 bg-slate-900/80 backdrop-blur-xl flex flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-slate-700/50 px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Sketch2Startup
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navigation.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/dashboard" && location.pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer badge */}
      <div className="shrink-0 border-t border-slate-700/50 p-4">
        <div className="rounded-lg bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-cyan-500/20 p-3">
          <p className="text-xs text-slate-400">AI-Powered Generation</p>
          <p className="mt-0.5 text-xs font-medium text-slate-300">
            Sketch → Production App
          </p>
        </div>
      </div>
    </div>
  )
}
