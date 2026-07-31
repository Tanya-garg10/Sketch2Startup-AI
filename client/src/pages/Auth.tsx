import { useState } from "react";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { firebaseAuth } from "../lib/firebase";

export function Auth({ mode }: { mode: "login" | "register" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Firebase Auth ready");

  async function submit() {
    const action = mode === "register" ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
    await action(firebaseAuth, email, password);
    setMessage("Authenticated successfully");
  }

  async function resetPassword() {
    if (!email) {
      setMessage("Enter your email before requesting a reset link.");
      return;
    }
    await sendPasswordResetEmail(firebaseAuth, email);
    setMessage("Password reset email sent.");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 p-6">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-bold capitalize">{mode}</h1>
        <input className="mt-6 w-full rounded-xl bg-white/10 p-3" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input className="mt-3 w-full rounded-xl bg-white/10 p-3" placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button className="mt-5 w-full" onClick={submit}>Continue with Firebase</Button>
        <button className="mt-4 text-sm text-cyan-300" onClick={resetPassword}>Forgot password?</button>
        <p className="mt-3 text-sm text-slate-400">{message}</p>
      </Card>
    </div>
  );
}
