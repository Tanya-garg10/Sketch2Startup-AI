import { ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "ghost" | "outline" | "destructive" | "secondary" | "link"
    size?: "default" | "sm" | "lg" | "icon"
}

const variantClasses: Record<string, string> = {
    default:
        "bg-violet-600 text-white shadow-lg shadow-violet-950/40 hover:bg-cyan-500",
    ghost:
        "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100",
    outline:
        "border border-slate-600 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100",
    destructive:
        "bg-red-600 text-white hover:bg-red-700",
    secondary:
        "bg-slate-700 text-slate-200 hover:bg-slate-600",
    link:
        "underline-offset-4 hover:underline text-cyan-400 bg-transparent p-0 h-auto",
}

const sizeClasses: Record<string, string> = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 py-1.5 text-xs",
    lg: "h-12 px-6 py-3 text-base",
    icon: "h-9 w-9 p-0",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-xl font-semibold transition-colors",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                    variantClasses[variant],
                    sizeClasses[size],
                    className
                )}
                {...props}
            />
        )
    }
)

Button.displayName = "Button"
