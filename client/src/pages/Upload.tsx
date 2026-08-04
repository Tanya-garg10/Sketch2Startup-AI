import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Badge } from "../components/ui/badge"
import { api } from "../lib/api"
import { UploadCloud, Image as ImageIcon, FileText, X, Check, Sparkles, AlertCircle } from "lucide-react"

export function Upload() {
  const navigate = useNavigate()
  const [url, setUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [projectId, setProjectId] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"]
      if (validTypes.includes(f.type)) {
        setUrl(URL.createObjectURL(f))
        setFile(f)
        setError("")
        setResult(null)
      } else {
        setError("Please select a valid file (PNG, JPG, JPEG, PDF)")
      }
    }
  }

  const handleRemoveFile = () => {
    setUrl("")
    setFile(null)
    setError("")
    setResult(null)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError("")
    try {
      // First create a project
      const project = await api<any>("/projects", {
        method: "POST",
        body: JSON.stringify({ name: file.name.split('.')[0] }),
      })
      setProjectId(project.id)

      // Read file as blob for reuse
      const fileBlob = await file.arrayBuffer()
      const fileBlobObject = new Blob([fileBlob], { type: file.type })

      // Analyze the file first
      setAnalyzing(true)
      const analyzeForm = new FormData()
      analyzeForm.append("file", new File([fileBlob], file.name, { type: file.type }))
      analyzeForm.append("project_id", project.id)
      const analyzeRes = await api("/analyze", {
        method: "POST",
        body: analyzeForm,
      })

      setResult(analyzeRes)
      setAnalyzing(false)

      // Upload file with fresh FormData
      setUploading(true)
      const uploadForm = new FormData()
      uploadForm.append("file", new File([fileBlob], file.name, { type: file.type }))
      uploadForm.append("project_id", project.id)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const uploadRes = await api("/uploads", { method: "POST", body: uploadForm })
      setUploadProgress(100)
      clearInterval(progressInterval)

      // Update project with analysis result and description from vision
      const appDesc = analyzeRes.app_description || ""
      await api(`/projects/${project.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "analyzed",
          description: appDesc || `Sketch upload: ${file.name}`,
        }),
      })

    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.")
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
      setAnalyzing(false)
      setUploadProgress(0)
    }
  }

  const handleContinue = () => {
    if (projectId) {
      navigate(`/prd?project=${projectId}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
          Upload Sketch
        </h2>
        <p className="text-slate-400">
          Upload your wireframe, sketch, or UI mockup to generate a full-stack application
        </p>
      </div>

      <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-8">
        {!file ? (
          <label className="group relative flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-600 bg-slate-900/50 transition-all hover:border-cyan-500/50 hover:bg-slate-800/50">
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 group-hover:bg-cyan-500/20 transition-colors">
                <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-slate-200">
                  Drag & drop or click to upload
                </p>
                <p className="text-sm text-slate-400">
                  Supports PNG, JPG, JPEG, PDF up to 10MB
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Images
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  PDFs
                </Badge>
              </div>
            </div>
          </label>
        ) : (
          <div className="space-y-6">
            <div className="relative rounded-xl overflow-hidden border border-slate-700">
              {file.type.startsWith("image/") ? (
                <img src={url} alt="Preview" className="w-full max-h-96 object-contain bg-slate-900" />
              ) : (
                <div className="flex h-80 items-center justify-center bg-slate-900">
                  <FileText className="h-16 w-16 text-slate-600" />
                </div>
              )}
              <button
                onClick={handleRemoveFile}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                disabled={uploading || analyzing}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium text-slate-200">{file.name}</p>
                <p className="text-sm text-slate-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Badge variant="secondary">{file.type.split('/')[1].toUpperCase()}</Badge>
            </div>

            {(uploading || analyzing) && (
              <div className="space-y-3">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-slate-400 text-center">
                  {uploading ? `Uploading... ${uploadProgress}%` : "Analyzing with AI..."}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRemoveFile}
                disabled={uploading || analyzing}
                className="flex-1"
              >
                Remove
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600"
                onClick={handleUpload}
                disabled={uploading || analyzing}
              >
                {uploading ? "Uploading..." : analyzing ? "Analyzing..." : "Upload & Analyze"}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-red-900/20 border border-red-500/30 p-4">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </Card>

      {result && (
        <Card className="border border-green-500/30 bg-green-500/10 backdrop-blur-sm p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-400">Analysis Complete!</h3>
              <p className="text-sm text-slate-400 mt-1">
                Your sketch has been analyzed successfully. AI detected {result.elements?.length || 0} UI elements.
              </p>
              {result.app_description && (
                <p className="text-sm text-cyan-300 mt-2 font-medium">"{result.app_description}"</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Analyzed by: {result.analyzed_by === "gemini-vision" ? "🤖 Gemini Vision AI" : result.analyzed_by === "text-analysis" ? "📚 Context Analysis" : "🔧 Mock Analysis"}
              </p>
            </div>
          </div>

          {/* App Type and Name */}
          {(result.app_type || result.app_name) && (
            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-slate-200">Application Details:</h4>
              <div className="flex flex-wrap gap-2">
                {result.app_type && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-violet-400" />
                    Type: {result.app_type}
                  </Badge>
                )}
                {result.app_name && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-cyan-400" />
                    {result.app_name}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Detected Features */}
          {result.features && result.features.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-slate-200">Detected Features:</h4>
              <div className="flex flex-wrap gap-2">
                {result.features.map((feature: string, index: number) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-green-400" />
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* User Flows */}
          {result.user_flows && result.user_flows.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-slate-200">User Flows:</h4>
              <div className="space-y-2">
                {result.user_flows.map((flow: string, index: number) => (
                  <div key={index} className="text-sm text-slate-300 bg-slate-800/50 p-2 rounded">
                    {flow}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Requirements */}
          {result.data_requirements && result.data_requirements.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-slate-200">Data Requirements:</h4>
              <div className="flex flex-wrap gap-2">
                {result.data_requirements.map((req: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <h4 className="font-medium text-slate-200">Detected Elements:</h4>
            <div className="flex flex-wrap gap-2">
              {result.elements?.map((element: any, index: number) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  {element.type} {element.confidence ? `(${Math.round(element.confidence * 100)}%)` : ''}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h4 className="font-medium text-slate-200">Suggested Components:</h4>
            <div className="flex flex-wrap gap-2">
              {result.components?.map((component: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {component}
                </Badge>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="space-y-3 mb-6">
              <h4 className="font-medium text-slate-200">AI Suggestions:</h4>
              <div className="space-y-2">
                {result.suggestions.map((suggestion: string, index: number) => (
                  <div key={index} className="text-sm text-slate-300 bg-slate-800/50 p-2 rounded flex items-start gap-2">
                    <span className="text-cyan-400">•</span>
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600"
            onClick={handleContinue}
          >
            Continue to PRD Generation
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      )}
    </div>
  )
}
