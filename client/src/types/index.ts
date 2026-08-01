export interface Project {
  id: string
  name: string
  status: "draft" | "analyzing" | "generating" | "completed" | "failed"
  created_at: string
  last_updated?: string
  user_id?: string
}

export interface Artifact {
  id: string
  project_id: string
  kind: string
  content: Record<string, any>
  markdown?: string
}

export interface PRD {
  project_name: string
  problem_statement: string
  solution: string
  target_users: string[]
  user_stories: string[]
  functional_requirements: string[]
  non_functional_requirements: string[]
  tech_stack: string[]
  acceptance_criteria: string[]
  future_scope: string[]
}

export interface DatabaseSchema {
  tables: {
    name: string
    columns: {
      name: string
      type: string
      constraints: string[]
    }[]
    relationships: {
      table: string
      type: "one_to_one" | "one_to_many" | "many_to_many"
      foreign_key: string
    }[]
  }[]
}

export interface APIEndpoint {
  path: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  description: string
  parameters?: {
    name: string
    type: string
    required: boolean
    description: string
  }[]
  response: Record<string, any>
}

export interface WorkflowStep {
  id: string
  name: string
  status: "pending" | "in_progress" | "completed" | "failed"
  description?: string
}