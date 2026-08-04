import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { api } from "../lib/api"
import { Sparkles, FileText, Download, Copy, Check, Loader2 } from "lucide-react"

export function PRDPage() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get("project")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [prd, setPrd] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (projectId) {
      fetchPRD()
    }
  }, [projectId])

  const fetchPRD = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const artifacts = await api<any[]>(`/projects/${projectId}/artifacts?kind=prd`)
      if (artifacts.length > 0) {
        const raw = artifacts[0].content
        // Normalize field names in case they were stored with AI-returned variations
        const normalized = {
          project_name: raw.project_name || raw.title || raw.name || "Untitled Project",
          problem_statement: raw.problem_statement || raw.problem || raw.overview || "",
          solution: raw.solution || raw.description || "",
          target_users: Array.isArray(raw.target_users) ? raw.target_users : (raw.target_users ? [raw.target_users] : (raw.users || raw.audience || [])),
          user_stories: Array.isArray(raw.user_stories) ? raw.user_stories : (raw.stories || []),
          functional_requirements: Array.isArray(raw.functional_requirements) ? raw.functional_requirements : (raw.requirements || raw.features || []),
          non_functional_requirements: Array.isArray(raw.non_functional_requirements) ? raw.non_functional_requirements : (raw.nfr || raw.constraints || []),
          tech_stack: Array.isArray(raw.tech_stack) ? raw.tech_stack : (raw.technologies || raw.stack || []),
          acceptance_criteria: Array.isArray(raw.acceptance_criteria) ? raw.acceptance_criteria : (raw.criteria || []),
          future_scope: Array.isArray(raw.future_scope) ? raw.future_scope : (raw.roadmap || raw.next_steps || []),
        }
        setPrd(normalized)
      }
    } catch (error) {
      console.error("Failed to fetch PRD:", error)
    } finally {
      setLoading(false)
    }
  }

  const generatePRD = async () => {
    if (!projectId) return
    setGenerating(true)
    setError("")
    setPrd(null)
    try {
      // Fetch project description (from vision analysis)
      let projectDesc = ""
      try {
        const project = await api<any>(`/projects/${projectId}`)
        projectDesc = project.description || ""
      } catch { }

      const prompt = projectDesc
        ? `Generate PRD for: ${projectDesc}`
        : "Generate PRD for a web application"

      const result = await api<any>("/prd", {
        method: "POST",
        body: JSON.stringify({ project_id: projectId, prompt }),
      })

      // Normalize output — AI sometimes returns slightly different key names
      let output = result?.output
      if (!output) {
        throw new Error("AI returned no output. Please try again.")
      }

      // Normalize common field name variations
      output = {
        project_name: output.project_name || output.title || output.name || "Untitled Project",
        problem_statement: output.problem_statement || output.problem || output.overview || "",
        solution: output.solution || output.description || "",
        target_users: output.target_users || output.users || output.audience || [],
        user_stories: output.user_stories || output.stories || [],
        functional_requirements: output.functional_requirements || output.requirements || output.features || [],
        non_functional_requirements: output.non_functional_requirements || output.nfr || output.constraints || [],
        tech_stack: output.tech_stack || output.technologies || output.stack || [],
        acceptance_criteria: output.acceptance_criteria || output.criteria || [],
        future_scope: output.future_scope || output.roadmap || output.next_steps || [],
      }

      // Ensure all array fields are actually arrays
      const arrayFields = ["target_users", "user_stories", "functional_requirements", "non_functional_requirements", "tech_stack", "acceptance_criteria", "future_scope"] as const
      for (const field of arrayFields) {
        if (!Array.isArray(output[field])) {
          output[field] = output[field] ? [String(output[field])] : []
        }
      }

      // Upsert artifact
      await api(`/projects/${projectId}/artifacts`, {
        method: "POST",
        body: JSON.stringify({
          kind: "prd",
          content: output,
          markdown: generateMarkdown(output),
        }),
      })

      setPrd(output)
    } catch (err: any) {
      console.error("Failed to generate PRD:", err)
      setError(err.message || "Generation failed. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const generateMarkdown = (content: any) => {
    return `# Product Requirement Document: ${content.project_name}

## Problem Statement
${content.problem_statement}

## Solution
${content.solution}

## Target Users
${content.target_users.map((user: string) => `- ${user}`).join('\n')}

## User Stories
${content.user_stories.map((story: string) => `- ${story}`).join('\n')}

## Functional Requirements
${content.functional_requirements.map((req: string) => `- ${req}`).join('\n')}

## Non-Functional Requirements
${content.non_functional_requirements.map((req: string) => `- ${req}`).join('\n')}

## Tech Stack
${content.tech_stack.map((tech: string) => `- ${tech}`).join('\n')}

## Acceptance Criteria
${content.acceptance_criteria.map((criteria: string) => `- ${criteria}`).join('\n')}

## Future Scope
${content.future_scope.map((scope: string) => `- ${scope}`).join('\n')}
`
  }

  const copyToClipboard = () => {
    if (prd) {
      navigator.clipboard.writeText(generateMarkdown(prd))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadMarkdown = () => {
    if (prd) {
      const blob = new Blob([generateMarkdown(prd)], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${prd.project_name.replace(/\s+/g, '_')}_PRD.md`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Product Requirements Document
          </h2>
          <p className="mt-1 text-slate-400">AI-generated requirements for your project</p>
        </div>
        <div className="flex gap-2">
          {prd && (
            <>
              <Button variant="outline" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="outline" onClick={downloadMarkdown}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={generatePRD}
                disabled={generating}
              >
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {generating ? "Regenerating..." : "Regenerate"}
              </Button>
            </>
          )}
          {!prd && (
            <Button
              className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600"
              onClick={generatePRD}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate PRD
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-900/20 border border-red-500/30 p-4">
          <span className="text-red-400 text-sm">⚠ {error}</span>
        </div>
      )}

      {prd ? (
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  Project Overview
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Project Name</Label>
                    <p className="mt-1 text-slate-300">{prd.project_name}</p>
                  </div>
                  <div>
                    <Label>Problem Statement</Label>
                    <p className="mt-1 text-slate-300">{prd.problem_statement}</p>
                  </div>
                  <div>
                    <Label>Solution</Label>
                    <p className="mt-1 text-slate-300">{prd.solution}</p>
                  </div>
                </div>
              </Card>

              <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Target Users</h3>
                <div className="flex flex-wrap gap-2">
                  {prd.target_users.map((user: string, index: number) => (
                    <Badge key={index} variant="secondary">{user}</Badge>
                  ))}
                </div>
              </Card>

              <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">User Stories</h3>
                <ul className="space-y-2">
                  {prd.user_stories.map((story: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-slate-300">
                      <span className="text-cyan-400 mt-1">•</span>
                      {story}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {prd.tech_stack.map((tech: string, index: number) => (
                    <Badge key={index} variant="outline">{tech}</Badge>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Functional Requirements</h3>
              <ul className="space-y-2">
                {prd.functional_requirements.map((req: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-slate-300">
                    <span className="text-green-400 mt-1">✓</span>
                    {req}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Non-Functional Requirements</h3>
              <ul className="space-y-2">
                {prd.non_functional_requirements.map((req: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-slate-300">
                    <span className="text-violet-400 mt-1">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Acceptance Criteria</h3>
              <ul className="space-y-2">
                {prd.acceptance_criteria.map((criteria: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-slate-300">
                    <span className="text-cyan-400 mt-1">{index + 1}.</span>
                    {criteria}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Future Scope</h3>
              <ul className="space-y-2">
                {prd.future_scope.map((scope: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-slate-300">
                    <span className="text-slate-500 mt-1">→</span>
                    {scope}
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="markdown">
            <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
              <Textarea
                value={generateMarkdown(prd)}
                readOnly
                className="min-h-[600px] font-mono text-sm"
              />
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-12 text-center">
          <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-200 mb-2">No PRD Generated Yet</h3>
          <p className="text-slate-400 mb-6">
            Generate a comprehensive Product Requirements Document for your project using AI
          </p>
          <Button
            className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600"
            onClick={generatePRD}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate PRD
              </>
            )}
          </Button>
        </Card>
      )}
    </div>
  )
}