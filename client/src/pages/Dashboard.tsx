import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { ProjectCard } from "../components/dashboard/ProjectCard"
import { WorkflowTimeline } from "../components/dashboard/WorkflowTimeline"
import { AgentStatus } from "../components/dashboard/AgentStatus"
import { useProjects } from "../hooks/useProjects"
import { useAuth } from "../hooks/useAuth"
import {
  Plus, FolderOpen, Zap, Sparkles, Upload, BarChart3,
  CheckCircle, Clock, AlertTriangle,
} from "lucide-react"

const WORKFLOW_STEPS = [
  { id: "1", name: "Vision Analysis", status: "pending" as const, description: "Analyze uploaded sketch" },
  { id: "2", name: "PRD Generation", status: "pending" as const, description: "Create product requirements" },
  { id: "3", name: "Architecture", status: "pending" as const, description: "Design system architecture" },
  { id: "4", name: "Database Schema", status: "pending" as const, description: "Generate database structure" },
  { id: "5", name: "API Development", status: "pending" as const, description: "Create REST APIs" },
  { id: "6", name: "Frontend", status: "pending" as const, description: "Build React components" },
  { id: "7", name: "Backend", status: "pending" as const, description: "Implement FastAPI backend" },
  { id: "8", name: "Testing", status: "pending" as const, description: "Generate test suites" },
  { id: "9", name: "Documentation", status: "pending" as const, description: "Create comprehensive docs" },
]

const AGENTS = [
  { name: "Planner Agent", status: "idle" as const, icon: Sparkles },
  { name: "Architect Agent", status: "idle" as const, icon: Zap },
  { name: "Database Agent", status: "idle" as const, icon: FolderOpen },
  { name: "API Agent", status: "idle" as const, icon: Zap },
  { name: "Builder Agent", status: "idle" as const, icon: Sparkles },
  { name: "Tester Agent", status: "idle" as const, icon: Zap },
  { name: "Documentation Agent", status: "idle" as const, icon: FolderOpen },
]

export function Dashboard() {
  const { user } = useAuth()
  const { projects, loading, error, createProject, deleteProject } = useProjects()
  const [showNewProject, setShowNewProject] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [creating, setCreating] = useState(false)

  const completedProjects = projects.filter((p) => p.status === "completed").length
  const activeProjects = projects.filter((p) =>
    ["analyzing", "generating"].includes(p.status)
  ).length
  const failedProjects = projects.filter((p) => p.status === "failed").length

  const handleCreate = async () => {
    if (!projectName.trim()) return
    setCreating(true)
    try {
      await createProject(projectName.trim())
      setShowNewProject(false)
      setProjectName("")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="mt-1 text-slate-400">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}! Manage your AI-generated projects.
          </p>
        </motion.div>
        <Button
          className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600"
          onClick={() => setShowNewProject(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Quick Upload */}
        <Card className="border border-slate-700/50 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 backdrop-blur-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Quick Upload</p>
              <p className="text-xs text-slate-400">New project</p>
            </div>
          </div>
          <Link to="/upload">
            <Button size="sm" className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-xs">
              Upload Sketch
            </Button>
          </Link>
        </Card>

        <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Total Projects</p>
              <p className="text-xs text-slate-400">All time</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-cyan-400">{projects.length}</p>
        </Card>

        <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Completed</p>
              <p className="text-xs text-slate-400">Ready to deploy</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-400">{completedProjects}</p>
        </Card>

        <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700">
              <Zap className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">AI Pipeline</p>
              <p className="text-xs text-slate-400">System status</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-400">Ready</p>
        </Card>
      </div>

      {/* Projects + Workflow */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-200">Recent Projects</h3>
            {projects.length > 0 && (
              <Link to="/projects" className="text-sm text-cyan-400 hover:text-cyan-300">
                View all →
              </Link>
            )}
          </div>

          {loading ? (
            <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-8 text-center">
              <div className="h-5 w-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Loading projects…</p>
            </Card>
          ) : error ? (
            <Card className="border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-6 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </Card>
          ) : projects.length === 0 ? (
            <Card className="border border-dashed border-slate-700 bg-slate-800/20 backdrop-blur-sm p-12 text-center">
              <FolderOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No projects yet. Upload your first sketch!</p>
              <Link to="/upload">
                <Button className="bg-gradient-to-r from-violet-500 to-cyan-500">
                  Create First Project
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-3">
              {projects.slice(0, 6).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={deleteProject}
                />
              ))}
            </div>
          )}
        </div>

        {/* Workflow + Agents */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-200">Workflow Overview</h3>
          <WorkflowTimeline steps={WORKFLOW_STEPS} />
          <AgentStatus agents={AGENTS} />
        </div>
      </div>

      {/* New Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="border border-slate-700 bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-200">Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="project-name" className="text-slate-300">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. My SaaS App"
                className="mt-1"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewProject(false)}>Cancel</Button>
            <Button
              className="bg-gradient-to-r from-violet-500 to-cyan-500"
              onClick={handleCreate}
              disabled={!projectName.trim() || creating}
            >
              {creating ? "Creating…" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
