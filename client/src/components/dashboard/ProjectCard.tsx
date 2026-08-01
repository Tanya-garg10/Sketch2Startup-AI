import { Link } from "react-router-dom"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Calendar, ArrowRight, Trash2 } from "lucide-react"
import { cn } from "../../lib/utils"

interface ProjectCardProps {
  project: {
    id: string
    name: string
    status: string
    created_at: string
    description?: string
  }
  onDelete?: (id: string) => void
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-700/50 text-slate-300 border-slate-600",
  analyzing: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  generating: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const color = statusColors[project.status] ?? statusColors.draft

  return (
    <Card className="group relative overflow-hidden border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm transition-all hover:border-cyan-500/40 hover:bg-slate-800/50">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-200 truncate pr-3">{project.name}</h3>
          <Badge className={cn("shrink-0 capitalize text-xs", color)}>{project.status}</Badge>
        </div>

        {project.description && (
          <p className="text-sm text-slate-400 mb-3 line-clamp-2">{project.description}</p>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Calendar className="h-3 w-3" />
          <span>{new Date(project.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex gap-2">
          <Link to={`/prd?project=${project.id}`} className="flex-1">
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-violet-500/80 to-cyan-500/80 hover:from-violet-500 hover:to-cyan-500 text-xs"
            >
              Open
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          </Link>
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 px-2"
              onClick={() => onDelete(project.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
