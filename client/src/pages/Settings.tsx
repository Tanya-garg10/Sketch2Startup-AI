import { useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Badge } from "../components/ui/badge"
import { firebaseAuth } from "../lib/firebase"
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { User, Lock, Bell, Palette, Save, Check, AlertCircle, Sparkles } from "lucide-react"

export function Settings() {
    const user = firebaseAuth.currentUser
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [saving, setSaving] = useState(false)

    const handleChangePassword = async () => {
        if (!user || !user.email) return
        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" })
            return
        }
        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters" })
            return
        }
        setSaving(true)
        setMessage(null)
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword)
            await reauthenticateWithCredential(user, credential)
            await updatePassword(user, newPassword)
            setMessage({ type: "success", text: "Password updated successfully" })
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to update password" })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                    Settings
                </h2>
                <p className="mt-1 text-slate-400">Manage your account and preferences</p>
            </div>

            {/* Profile */}
            <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
                        <User className="h-5 w-5 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-200">Profile</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <Label>Email Address</Label>
                        <div className="mt-1 flex items-center gap-3">
                            <Input value={user?.email || ""} disabled className="bg-slate-900/50" />
                            <Badge variant="outline" className="text-green-400 border-green-500/30 whitespace-nowrap">
                                Verified
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <Label>Account ID</Label>
                        <Input value={user?.uid || ""} disabled className="mt-1 bg-slate-900/50 font-mono text-xs" />
                    </div>
                </div>
            </Card>

            {/* Security */}
            <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
                        <Lock className="h-5 w-5 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-200">Change Password</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="mt-1"
                        />
                    </div>

                    {message && (
                        <div className={`flex items-center gap-2 rounded-lg p-3 ${message.type === "error"
                            ? "bg-red-500/10 border border-red-500/30"
                            : "bg-green-500/10 border border-green-500/30"
                            }`}>
                            {message.type === "error"
                                ? <AlertCircle className="h-4 w-4 text-red-400" />
                                : <Check className="h-4 w-4 text-green-400" />}
                            <p className={`text-sm ${message.type === "error" ? "text-red-300" : "text-green-300"}`}>
                                {message.text}
                            </p>
                        </div>
                    )}

                    <Button
                        className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600"
                        onClick={handleChangePassword}
                        disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                    >
                        {saving ? "Saving..." : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Update Password
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {/* Preferences */}
            <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
                        <Palette className="h-5 w-5 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-200">Preferences</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                        <div>
                            <p className="font-medium text-slate-200">Theme</p>
                            <p className="text-sm text-slate-400">Current visual theme</p>
                        </div>
                        <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">Dark Mode</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                        <div>
                            <p className="font-medium text-slate-200">AI Generation</p>
                            <p className="text-sm text-slate-400">Groq LLM (llama-3.3-70b) — ultra-fast inference</p>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Groq LLM</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                        <div>
                            <p className="font-medium text-slate-200">AI Research</p>
                            <p className="text-sm text-slate-400">Tavily Search — real-time web context</p>
                        </div>
                        <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">Tavily Search</Badge>
                    </div>
                </div>
            </Card>

            {/* AI Status */}
            <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
                        <Sparkles className="h-5 w-5 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-200">AI Agents</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {["Planner", "Architect", "Database", "API", "Builder", "Tester", "Docs", "Deploy"].map((agent) => (
                        <div key={agent} className="flex items-center gap-2 rounded-lg bg-slate-900/50 border border-slate-700 p-3">
                            <div className="h-2 w-2 rounded-full bg-green-400" />
                            <span className="text-sm text-slate-300">{agent}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}
