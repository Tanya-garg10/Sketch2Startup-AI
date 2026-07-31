import { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
export function Button({className,...props}:ButtonHTMLAttributes<HTMLButtonElement>){return <button className={cn("rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:bg-cyan-500 disabled:opacity-50",className)} {...props}/>;}
