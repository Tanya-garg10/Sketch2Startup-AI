import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, onAuthStateChanged, User } from "firebase/auth"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { firebaseAuth } from "../lib/firebase"
import { Sparkles, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react"

export function Auth({ mode }: { mode: "login" | "register" }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        navigate("/dashboard")
      }
    })
    return () => unsubscribe()
  }, [navigate])

  async function submit() {
    setMessage("")
    setLoading(true)
    try {
      const action = mode === "register" ? createUserWithEmailAndPassword : signInWithEmailAndPassword
      await action(firebaseAuth, email, password)
      setMessage("Authenticated successfully")
      // Navigation will happen via useEffect
    } catch (error: any) {
      setMessage(error.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword() {
    if (!email) {
      setMessage("Enter your email before requesting a reset link.")
      return
    }
    try {
      await sendPasswordResetEmail(firebaseAuth, email)
      setMessage("Password reset email sent.")
    } catch (error: any) {
      setMessage(error.message || "Failed to send reset email")
    }
  }

  const isError = message.includes("failed") || message.includes("Enter")
  const isSuccess = message.includes("success") || message.includes("sent")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,#7c3aed55,transparent_30%),radial-gradient(circle_at_80%_0%,#06b6d455,transparent_25%)]" />
      
      <div className="relative w-full max-w-md">
        <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-8">
          <div className="text-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent capitalize">
              {mode}
            </h1>
            <p className="mt-2 text-slate-400">
              {mode === "login" ? "Welcome back! Sign in to your account" : "Create your account to get started"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            {mode === "login" && (
              <div className="text-right">
                <button
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  onClick={resetPassword}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600"
              onClick={submit}
              disabled={loading || !email || !password}
            >
              {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>

            {message && (
              <div className={`flex items-center gap-2 rounded-lg p-3 ${
                isError ? "bg-red-500/10 border border-red-500/30" : "bg-green-500/10 border border-green-500/30"
              }`}>
                {isError ? (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
                <p className={`text-sm ${isError ? "text-red-300" : "text-green-300"}`}>
                  {message}
                </p>
              </div>
            )}

            <div className="text-center text-sm text-slate-400">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <Link to="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}
