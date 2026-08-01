import * as React from "react"
import { cn } from "../../lib/utils"

export interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue || "")
  
  const handleValueChange = (newValue: string) => {
    setActiveTab(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, {
            value: value || activeTab,
            onValueChange: handleValueChange,
          })
        }
        return child
      })}
    </div>
  )
}

export function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-800/50 p-1", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, onValueChange, className, children, ...props }: any) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-slate-950 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400",
        className
      )}
      data-state={onValueChange?.toString() === value ? "active" : "inactive"}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, currentValue, className, children, ...props }: any) {
  if (value !== currentValue) return null
  return (
    <div
      className={cn("mt-2 ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500", className)}
      {...props}
    >
      {children}
    </div>
  )
}