import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Cpu, FileText, Database, Code, TestTube, BookOpen } from "lucide-react"

interface AgentStatusProps {
  agents: {
    name: string
    status: "idle" | "running" | "completed" | "failed"
    progress?: number
    icon: any
  }[]
}

export function AgentStatus({ agents }: AgentStatusProps) {
  const statusColors = {
    idle: "bg-slate-700 text-slate-400",
    running: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
  }

  return (
    <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-6">AI Agents Status</h3>
      
      <div className="space-y-4">
        {agents.map((agent) => (
          <div key={agent.name} className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
              <agent.icon className="h-5 w-5 text-slate-400" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-slate-200">{agent.name}</p>
                <Badge className={statusColors[agent.status]}>
                  {agent.status}
                </Badge>
              </div>
              
              {agent.status === "running" && agent.progress !== undefined && (
                <Progress value={agent.progress} className="h-1" />
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}