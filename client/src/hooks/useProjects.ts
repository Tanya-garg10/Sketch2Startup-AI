import { useState, useEffect } from "react"
import { api } from "../lib/api"
import { Project } from "../types"
import { firebaseAuth } from "../lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait for Firebase auth to be ready before fetching
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        fetchProjects()
      } else {
        setProjects([])
        setLoading(false)
      }
    })
    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const data = await api<Project[]>("/projects")
      setProjects(data)
      setError(null)
    } catch (err: any) {
      // 401 means not logged in yet — treat as empty list, not an error
      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        setProjects([])
        setError(null)
      } else {
        setError(err.message || "Failed to fetch projects")
      }
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (name: string, description?: string): Promise<Project> => {
    const data = await api<Project>("/projects", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    })
    setProjects((prev) => [data, ...prev])
    return data
  }

  const deleteProject = async (id: string) => {
    await api(`/projects/${id}`, { method: "DELETE" })
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return { projects, loading, error, fetchProjects, createProject, deleteProject }
}
