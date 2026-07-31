import Editor from "@monaco-editor/react";import { Card } from "../components/ui/card";
export function GeneratorPage({title}:{title:string}){return <div><h2 className="text-3xl font-bold">{title}</h2><div className="mt-6 grid gap-4 lg:grid-cols-3"><Card><h3 className="font-bold">Agent Status</h3><p className="mt-2 text-cyan-300">Ready to generate structured JSON and logs.</p></Card><Card className="lg:col-span-2"><Editor height="420px" theme="vs-dark" defaultLanguage="markdown" defaultValue={`# ${title}
Generated artifact will appear here.`}/></Card></div></div>}
