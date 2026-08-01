import { Card } from "../ui/card"
import { Check, Loader2, Circle } from "lucide-react"
import { cn } from "../../lib/utils"

interface WorkflowStep {
  id: string
  name: string
  status: "pending" | "in_progress" | "completed" | "failed"
  description?: string
}

interface WorkflowTimelineProps {
  steps: WorkflowStep[]
}

export function WorkflowTimeline({ steps }: WorkflowTimelineProps) {
  return (
    <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-6">AI Workflow Progress</h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            {index !== steps.length - 1 && (
              <div className="absolute left-4 top-8 h-full w-0.5 bg-slate-700" />
            )}
            
            <div className="flex items-start gap-4">
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border-2 border-slate-700">
                {step.status === "completed" && (
                  <Check className="h-4 w-4 text-green-400" />
                )}
                {step.status === "in_progress" && (
                  <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                )}
                {step.status === "pending" && (
                  <Circle className="h-3 w-3 text-slate-500" />
                )}
                {step.status === "failed" && (
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                )}
              </div>
              
              <div className="flex-1 pt-1">
                <p className={cn(
                  "font-medium",
                  step.status === "completed" ? "text-green-400" :
                  step.status === "in_progress" ? "text-cyan-400" :
                  step.status === "failed" ? "text-red-400" :
                  "text-slate-400"
                )}>
                  {step.name}
                </p>
                {step.description && (
                  <p className="mt-1 text-sm text-slate-500">{step.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}