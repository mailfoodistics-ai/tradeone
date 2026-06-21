import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AmbientBackground } from "@/components/edge/AmbientBackground";
import { TradeOneLogo } from "@/components/TradeOneLogo";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        const msg = 'Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
        console.error(msg);
        setErrorMsg(msg);
        setLoading(false);
        return;
      }

      // Explicitly provide a redirectTo so Supabase knows where to return after Google OAuth.
      const redirectTo = `${window.location.origin}/app/dashboard`;
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });

      if (error) {
        console.error('Supabase OAuth error:', error);
        setErrorMsg(error.message || 'OAuth error');
        setLoading(false);
        return;
      }

      // In some environments supabase returns a URL to redirect to. If present, navigate there.
      // Otherwise the SDK should handle the redirect automatically.
      // Fallback: after a short delay, navigate to the app for local dev.
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setTimeout(() => navigate("/app/dashboard"), 600);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4">
      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md mx-auto"
      >
        <div className="rounded-3xl glass-strong p-8 glow-ring">
          <Link to="/" className="inline-flex items-center gap-2 group mb-6">
            <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
              <span className="absolute inset-0 rounded-lg blur-md bg-primary/30 group-hover:bg-primary/50 transition"/>
              <TradeOneLogo className="relative h-4 w-4 text-primary" />
            </span>
            <span className="text-[14px] font-semibold tracking-tight">tradeOne</span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Welcome back.</h1>
          <p className="mt-1.5 text-[13px] text-white/55">Sign in to continue building your edge.</p>

          <div className="mt-6">
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-primary px-4 py-3 text-[13px] font-medium text-primary-foreground transition hover:shadow-[0_0_40px_-4px_oklch(0.87_0.22_152/0.8)] inline-flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="relative h-4 w-4" fill="currentColor"><path d="M21.35 11.1H12v3.83h5.36c-.23 1.24-1.6 3.65-5.36 3.65-3.22 0-5.85-2.66-5.85-5.93s2.63-5.93 5.85-5.93c1.83 0 3.07.78 3.77 1.45l2.57-2.48C16.86 4.33 14.65 3.4 12 3.4 6.92 3.4 2.82 7.5 2.82 12.6S6.92 21.8 12 21.8c6.93 0 9.5-4.85 9.5-7.36 0-.5-.06-.89-.15-1.34z"/></svg>
              <span className="relative">Continue with Google</span>
            </button>
            <p className="mt-3 text-center text-[11px] text-white/40">Sign in with your Google account to access tradeOne.</p>
            {errorMsg && <div className="mt-3 text-center text-[12px] text-destructive">{errorMsg}</div>}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
