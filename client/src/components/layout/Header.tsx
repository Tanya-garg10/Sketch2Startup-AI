import { Bell, Search, User, LogOut } from "lucide-react"
import { Button } from "../ui/button"
import { firebaseAuth } from "../../lib/firebase"

export function Header() {
  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="h-9 w-64 rounded-lg border border-slate-700 bg-slate-800/50 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-400" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-cyan-500" />
        </Button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-200">
              {firebaseAuth.currentUser?.email || "User"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      </div>
    </header>
  )
}