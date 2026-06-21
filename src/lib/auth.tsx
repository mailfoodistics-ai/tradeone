import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "./supabase";

type User = any;

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data?.session?.user ?? null);
      setLoading(false);
    }
    init();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  // Redirect to /login when not authenticated. Show spinner while loading.
  const { loading, user } = useAuth();
  if (loading) return <div className="grid place-items-center min-h-[200px]">Loading…</div>;
  if (!user) {
    // Use react-router redirect so navigation history is handled correctly.
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
