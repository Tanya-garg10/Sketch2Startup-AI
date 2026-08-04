import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import Editor from "@monaco-editor/react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import { api } from "../lib/api"
import { Sparkles, Download, Copy, Check, Loader2, Play, FileText, Database, Code, TestTube, Book } from "lucide-react"

const agentConfig: Record<string, { endpoint: string; icon: any; language: string; description: string; kind: string }> = {
  Architecture: { endpoint: "/architecture", icon: Sparkles, language: "markdown", description: "System architecture design", kind: "architecture" },
  Database: { endpoint: "/database", icon: Database, language: "sql", description: "Database schema and migrations", kind: "database" },
  Apis: { endpoint: "/apis", icon: Code, language: "python", description: "REST API endpoints", kind: "apis" },
  Frontend: { endpoint: "/frontend", icon: Code, language: "typescript", description: "React components and pages", kind: "frontend" },
  Backend: { endpoint: "/backend", icon: Code, language: "python", description: "FastAPI backend code", kind: "backend" },
  Testing: { endpoint: "/tests", icon: TestTube, language: "python", description: "Test suites and coverage", kind: "testing" },
  Documentation: { endpoint: "/docs", icon: Book, language: "markdown", description: "Comprehensive documentation", kind: "documentation" },
  Deployment: { endpoint: "/deployment", icon: Sparkles, language: "yaml", description: "Docker, Vercel, Render deployment configs", kind: "deployment" },
  Projects: { endpoint: "", icon: FileText, language: "json", description: "Project overview", kind: "projects" },
  Settings: { endpoint: "", icon: Sparkles, language: "json", description: "Project settings", kind: "settings" },
}

export function GeneratorPage({ title }: { title: string }) {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get("project")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [content, setContent] = useState("")
  const [copied, setCopied] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [genError, setGenError] = useState("")

  const config = agentConfig[title] || agentConfig.Architecture
  const Icon = config.icon

  // Clear content immediately when switching agents so stale content never shows
  useEffect(() => {
    setContent("")
    setLogs([])
    setProgress(0)
    if (projectId) {
      fetchArtifact()
    }
  }, [projectId, title])

  const fetchArtifact = async () => {
    if (!projectId || !config.endpoint) return
    setLoading(true)
    try {
      const kind = config.kind
      const artifacts = await api<any[]>(`/projects/${projectId}/artifacts?kind=${kind}`)
      if (artifacts.length > 0) {
        setContent(artifacts[0].markdown || JSON.stringify(artifacts[0].content, null, 2))
      }
    } catch (error) {
      console.error("Failed to fetch artifact:", error)
    } finally {
      setLoading(false)
    }
  }

  const generate = async () => {
    if (!config.endpoint) return
    setGenerating(true)
    setProgress(0)
    setLogs([])
    setContent("")
    setGenError("")

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 300)

    try {
      // Build a context-aware prompt by loading existing PRD/architecture artifacts
      let contextPrompt = `Generate ${title}`
      if (projectId) {
        try {
          const [prdArtifacts, archArtifacts] = await Promise.all([
            api<any[]>(`/projects/${projectId}/artifacts?kind=prd`),
            api<any[]>(`/projects/${projectId}/artifacts?kind=architecture`),
          ])
          const prdContent = prdArtifacts[0]?.content
          const archContent = archArtifacts[0]?.content
          if (prdContent) {
            contextPrompt += `\n\nProject PRD context: ${JSON.stringify(prdContent).slice(0, 800)}`
          }
          if (archContent && title !== "Architecture") {
            contextPrompt += `\n\nArchitecture context: ${JSON.stringify(archContent).slice(0, 600)}`
          }
        } catch {
          // context fetch failed, proceed with basic prompt
        }
      }

      const result = await api<any>(config.endpoint, {
        method: "POST",
        body: JSON.stringify({ project_id: projectId, prompt: contextPrompt }),
      })

      if (!result?.output) throw new Error("Agent returned no output. Please try again.")

      setLogs(result.logs || [])
      setProgress(100)

      // Upsert artifact — replace existing one for this kind instead of duplicating
      if (projectId) {
        const kind = config.kind
        const markdown = generateMarkdown(result.output, title)

        // Delete existing artifact for this kind first
        const existing = await api<any[]>(`/projects/${projectId}/artifacts?kind=${kind}`)
        // (no delete endpoint, so we just create fresh — backend uses latest by created_at desc)

        await api(`/projects/${projectId}/artifacts`, {
          method: "POST",
          body: JSON.stringify({ kind, content: result.output, markdown }),
        })
        setContent(markdown)
      } else {
        setContent(JSON.stringify(result.output, null, 2))
      }
    } catch (error: any) {
      console.error("Generation failed:", error)
      setGenError(error?.message || "Generation failed. Please try again.")
      setLogs(["Generation failed. Please try again."])
    } finally {
      clearInterval(progressInterval)
      setGenerating(false)
    }
  }

  const generateMarkdown = (output: any, title: string): string => {
    if (typeof output === "string") return output
    const t = title.toLowerCase()

    if (t === "architecture") {
      const o = output
      return `# System Architecture

**Type:** ${o.architecture_type || ""}

## Components
${(o.components || []).map((c: any) => `### ${c.name}\n- **Tech:** ${c.technology}\n- **Responsibilities:** ${(c.responsibilities || []).join(", ")}`).join("\n\n")}

## Data Flow
${(o.data_flow || []).map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

## Security
${(o.security_considerations || []).map((s: string) => `- ${s}`).join("\n")}

## Scalability Plan
${(o.scalability_plan || []).map((s: string) => `- ${s}`).join("\n")}
`
    }

    if (t === "database") {
      const o = output
      return `# Database Schema

**Type:** ${o.database_type || ""}

## Tables
${(o.tables || []).map((tbl: any) => `### ${tbl.name}
| Column | Type | Constraints |
|--------|------|-------------|
${(tbl.columns || []).map((c: any) => `| ${c.name} | ${c.type} | ${(c.constraints || []).join(", ")} |`).join("\n")}
**Indexes:** ${(tbl.indexes || []).join(", ") || "none"}`).join("\n\n")}

## Relationships
${(o.relationships || []).map((r: any) => `- \`${r.from}\` → \`${r.to}\` (${r.type}, cascade: ${r.cascade})`).join("\n")}

## ER Diagram
\`\`\`
${o.er_diagram || ""}
\`\`\`

**Migration:** \`${o.migration_command || ""}\`
`
    }

    if (t === "apis") {
      const o = output
      return `# REST API Specification

**Base URL:** ${o.base_url || ""}
**Auth:** ${o.authentication || ""}
**Docs:** ${o.swagger_docs || ""}

## Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
${(o.endpoints || []).map((e: any) => `| \`${e.method}\` | \`${e.path}\` | ${e.description} | ${e.auth ? "✓" : "—"} |`).join("\n")}

## Error Responses
${Object.entries(o.error_responses || {}).map(([code, msg]) => `- **${code}**: ${msg}`).join("\n")}
`
    }

    if (t === "frontend" || t === "backend") {
      const o = output
      const section = t === "frontend" ? o.frontend : o.backend
      return `# ${title} Code Plan

## Framework
${section?.framework || ""}

## ${t === "frontend" ? "Components" : "Endpoints"}
${(section?.[t === "frontend" ? "components" : "endpoints"] || []).map((s: string) => `- ${s}`).join("\n")}

## ${t === "frontend" ? "Pages" : "Models"}
${(section?.[t === "frontend" ? "pages" : "models"] || []).map((s: string) => `- ${s}`).join("\n")}

## Integration Points
${(o.integration_points || []).map((s: string) => `- ${s}`).join("\n")}

## File Structure
\`\`\`
${(o.file_structure || []).join("\n")}
\`\`\`
`
    }

    if (t === "testing") {
      const o = output
      return `# Test Suite

**Framework:** ${o.test_framework || ""}
**Coverage Target:** ${o.coverage_target || ""}

## Unit Tests
${(o.unit_tests || []).map((s: string) => `- ${s}`).join("\n")}

## Integration Tests
${(o.integration_tests || []).map((s: string) => `- ${s}`).join("\n")}

## API Tests
${(o.api_tests || []).map((s: string) => `- ${s}`).join("\n")}

## Example Test
\`\`\`python
${o.test_examples?.example_test || ""}
\`\`\`

## Commands
${(o.testing_commands || []).map((s: string) => `\`\`\`bash\n${s}\n\`\`\``).join("\n")}
`
    }

    if (t === "documentation") {
      const o = output
      return `# Documentation

## ${o.readme?.title || "Project"}
${o.readme?.description || ""}

**Badges:** ${(o.readme?.badges || []).join(" · ")}

## Sections
${(o.readme?.sections || []).map((s: string) => `- ${s}`).join("\n")}

## Installation

### Prerequisites
${(o.installation_guide?.prerequisites || []).map((s: string) => `- ${s}`).join("\n")}

### Backend
\`\`\`bash
${(o.installation_guide?.backend_steps || []).join("\n")}
\`\`\`

### Frontend
\`\`\`bash
${(o.installation_guide?.frontend_steps || []).join("\n")}
\`\`\`

## Environment Variables

### Backend
${(o.environment_variables?.backend || []).map((s: string) => `- \`${s}\``).join("\n")}

### Frontend
${(o.environment_variables?.frontend || []).map((s: string) => `- \`${s}\``).join("\n")}

## Deployment
- **Frontend (Vercel):** ${o.deployment_guide?.frontend_vercel || ""}
- **Backend (Render):** ${o.deployment_guide?.backend_render || ""}
- **Docker:** ${o.deployment_guide?.docker || ""}
`
    }

    if (t === "deployment") {
      const o = output
      return `# Deployment Configuration

## Docker

### Backend Dockerfile
\`\`\`dockerfile
${o.docker?.backend_dockerfile || ""}
\`\`\`

### Frontend Dockerfile
\`\`\`dockerfile
${o.docker?.frontend_dockerfile || ""}
\`\`\`

**Tips:** ${(o.docker?.optimization_tips || []).join(", ")}

## Vercel (Frontend)
- **Build Command:** \`${o.vercel?.build_command || ""}\`
- **Output Directory:** \`${o.vercel?.output_directory || ""}\`
- **Deploy:** \`${o.vercel?.deploy_command || ""}\`
- **Env Vars:** ${(o.vercel?.env_vars || []).map((v: string) => `\`${v}\``).join(", ")}
- **Notes:** ${o.vercel?.notes || ""}

## Render (Backend)
- **Start Command:** \`${o.render?.start_command || ""}\`
- **Health Check:** \`${o.render?.health_check_path || ""}\`
- **Plan:** ${o.render?.plan || ""}
- **Env Vars:** ${(o.render?.env_vars || []).map((v: string) => `\`${v}\``).join(", ")}
- **Notes:** ${o.render?.notes || ""}

## CI/CD (${o.ci_cd?.platform || "GitHub Actions"})
- **Workflow:** \`${o.ci_cd?.workflow_file || ""}\`
- **Stages:** ${(o.ci_cd?.stages || []).join(" → ")}
- **Triggers:** ${o.ci_cd?.triggers || ""}

## Monitoring
- **Logging:** ${o.monitoring?.logging || ""}
- **Uptime:** ${o.monitoring?.uptime_check || ""}
- **Error Tracking:** ${o.monitoring?.error_tracking || ""}
`
    }

    // Fallback — pretty JSON
    return `# ${title}\n\n\`\`\`json\n${JSON.stringify(output, null, 2)}\n\`\`\`\n`
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadContent = () => {
    const extension = config.language === "typescript" ? "ts" : config.language
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.toLowerCase()}.${extension}`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {title} Generator
          </h2>
          <p className="mt-1 text-slate-400">{config.description}</p>
        </div>
        <div className="flex gap-2">
          {content && (
            <>
              <Button variant="outline" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="outline" onClick={downloadContent}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </>
          )}
          {config.endpoint && (
            <Button
              className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600"
              onClick={generate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
              <Icon className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Agent Status</h3>
              <Badge variant={generating ? "secondary" : "outline"} className="mt-1">
                {generating ? "Running" : "Ready"}
              </Badge>
            </div>
          </div>

          {generating && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-slate-400">{progress}% complete</p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-slate-300">Agent Logs</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <p key={index} className="text-xs text-slate-400 font-mono">
                    {log}
                  </p>
                ))
              ) : (
                <p className="text-xs text-slate-500">No logs yet</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden">
          {genError ? (
            <div className="flex h-[500px] items-center justify-center p-8">
              <div className="text-center space-y-3">
                <div className="text-4xl">⚠️</div>
                <p className="text-red-400 font-medium">{genError}</p>
                <p className="text-sm text-slate-400">Click Generate to try again</p>
              </div>
            </div>
          ) : content ? (
            <Editor
              height="500px"
              theme="vs-dark"
              defaultLanguage={config.language}
              value={content}
              onChange={(value) => setContent(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
            />
          ) : (
            <div className="flex h-[500px] items-center justify-center">
              <div className="text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 mx-auto">
                  <Icon className="h-8 w-8 text-slate-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-slate-200">No {title} Generated Yet</p>
                  <p className="text-sm text-slate-400">
                    Click the Generate button to create {title.toLowerCase()} using AI
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}