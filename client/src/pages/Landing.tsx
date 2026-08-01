import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import {
  Sparkles,
  Code,
  Database,
  Rocket,
  CheckCircle,
  ArrowRight,
  GitBranch as GithubIcon,
  ExternalLink as TwitterIcon,
  Link as LinkedinIcon,
  FileText,
  Zap
} from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "Vision Analysis",
    description: "AI-powered image recognition detects UI elements, layouts, and components from your sketches"
  },
  {
    icon: FileText,
    title: "Agentic PRDs",
    description: "Automatically generate comprehensive Product Requirement Documents with user stories"
  },
  {
    icon: Database,
    title: "Database Schemas",
    description: "Production-ready database designs with ER diagrams and migration scripts"
  },
  {
    icon: Code,
    title: "REST APIs",
    description: "Complete API endpoints with authentication, validation, and Swagger documentation"
  },
  {
    icon: Zap,
    title: "React/FastAPI Code",
    description: "Full-stack code generation with modern best practices and clean architecture"
  },
  {
    icon: Rocket,
    title: "Deployment Configs",
    description: "Ready-to-deploy configurations for Vercel, Render, and Docker"
  }
]

const techStack = [
  "React 19",
  "TypeScript",
  "Tailwind CSS",
  "FastAPI",
  "Python 3.12",
  "PostgreSQL",
  "Firebase Auth",
  "Firebase Storage"
]

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager",
    content: "Sketch2Startup AI reduced our prototype-to-production time from weeks to days. Absolutely game-changing!",
    avatar: "SC"
  },
  {
    name: "Alex Rodriguez",
    role: "Startup Founder",
    content: "As a non-technical founder, I can now turn my ideas into working applications. The AI agents are incredibly smart.",
    avatar: "AR"
  },
  {
    name: "Emily Watson",
    role: "Senior Developer",
    content: "The generated code is clean and follows best practices. It's like having a senior developer on the team 24/7.",
    avatar: "EW"
  }
]

const faqs = [
  {
    question: "What file formats are supported?",
    answer: "We support PNG, JPG, JPEG, and PDF files. You can upload wireframes, hand-drawn sketches, whiteboard photos, and UI mockups."
  },
  {
    question: "How accurate is the AI analysis?",
    answer: "Our vision AI achieves 90%+ accuracy in detecting common UI elements. The system learns and improves with each analysis."
  },
  {
    question: "Can I customize the generated code?",
    answer: "Absolutely! All generated code is fully customizable. You can modify it, add features, or use it as a starting point for your project."
  },
  {
    question: "What's included in the generated output?",
    answer: "You get PRD, database schema, REST APIs, React frontend, FastAPI backend, test suites, documentation, and deployment configurations."
  }
]

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Sketch2Startup AI
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,#7c3aed55,transparent_30%),radial-gradient(circle_at_80%_0%,#06b6d455,transparent_25%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <Badge className="bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border-cyan-500/30 text-cyan-400">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered App Generation
              </Badge>

              <h1 className="text-5xl font-black leading-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent md:text-7xl">
                Generate full-stack apps from UI sketches
              </h1>

              <p className="text-lg text-slate-400 max-w-xl">
                Upload a wireframe and orchestrate AI agents that produce PRDs, schemas, APIs, frontend, backend, tests, docs, and deployment assets.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 h-12 px-8">
                    Start Building Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" className="h-12 px-8 border-slate-700 hover:bg-slate-800">
                    View Demo
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  5 free projects
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  Cancel anytime
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-8">
                <div className="aspect-video rounded-xl border-2 border-dashed border-cyan-500/30 bg-slate-900/50 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 mx-auto">
                      <Sparkles className="h-8 w-8 text-cyan-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-slate-200">Sketch Preview</p>
                      <p className="text-sm text-slate-400">Upload your wireframe to see the magic</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Analysis Progress</span>
                    <span className="text-cyan-400">Ready</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-violet-500 to-cyan-500" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {["PRD", "Database", "API", "Frontend"].map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-3">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Everything you need to build production apps
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              From sketch to deployment in minutes, not weeks. Our AI agents handle the entire development lifecycle.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6 h-full hover:border-cyan-500/30 transition-colors">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 mb-4">
                    <feature.icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="px-6 py-20 bg-slate-900/50">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold text-slate-200 mb-4">Built with Modern Technologies</h2>
          <p className="text-slate-400 mb-12">Production-ready stack used by leading companies</p>

          <div className="flex flex-wrap justify-center gap-4">
            {techStack.map((tech) => (
              <Badge key={tech} variant="outline" className="px-4 py-2 text-sm border-slate-700">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-200 mb-4">Loved by builders worldwide</h2>
            <p className="text-slate-400">See what our users are saying about Sketch2Startup AI</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">{testimonial.name}</p>
                    <p className="text-sm text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-slate-300">{testimonial.content}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-20 bg-slate-900/50">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-200 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400">Everything you need to know about Sketch2Startup AI</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
                <h3 className="font-semibold text-slate-200 mb-2">{faq.question}</h3>
                <p className="text-slate-400">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <Card className="border border-cyan-500/30 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 backdrop-blur-sm p-12 text-center">
            <h2 className="text-3xl font-bold text-slate-200 mb-4">
              Ready to transform your sketches into production apps?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Join thousands of builders who are shipping faster with AI-powered development
            </p>
            <Link to="/register">
              <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 h-12 px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-slate-200">Sketch2Startup AI</span>
              </div>
              <p className="text-sm text-slate-400">
                Transform sketches into production-ready applications with AI
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-200 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/features" className="hover:text-slate-200">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-slate-200">Pricing</Link></li>
                <li><Link to="/docs" className="hover:text-slate-200">Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-200 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/about" className="hover:text-slate-200">About</Link></li>
                <li><Link to="/blog" className="hover:text-slate-200">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-slate-200">Careers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-200 mb-4">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="text-slate-400 hover:text-slate-200">
                  <GithubIcon className="h-5 w-5" />
                </a>
                <a href="#" className="text-slate-400 hover:text-slate-200">
                  <TwitterIcon className="h-5 w-5" />
                </a>
                <a href="#" className="text-slate-400 hover:text-slate-200">
                  <LinkedinIcon className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-400">
            <p>© 2026 Sketch2Startup AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
