import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "./supabase";

type User = any;

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function init() {
      // First, if we returned from an OAuth redirect, parse the URL fragment
      // to establish a session. Supabase returns tokens in the URL fragment
      // (after '#'). getSessionFromUrl() will read and set the session.
      try {
        // If Supabase returned OAuth tokens in the URL fragment (after '#'), parse them
        // and set the session using the client. This avoids relying on a helper that
        // may not be present in the client typings.
        if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
          const hash = window.location.hash.substring(1); // remove '#'
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token) {
            // setSession expects string tokens; pass only the values that exist
            const sessionPayload: { access_token: string; refresh_token?: string } = { access_token } as any;
            if (refresh_token) sessionPayload.refresh_token = refresh_token;
            const { data: setData, error: setError } = await supabase.auth.setSession(sessionPayload as any);
            if (setError) {
              console.error('setSession error', setError);
            } else if (setData?.session) {
              if (!mounted) return;
              setUser(setData.session.user ?? null);
              setLoading(false);
              // Clear URL fragment so tokens aren't visible
              const cleanUrl = window.location.href.replace(window.location.hash, '');
              window.history.replaceState({}, document.title, cleanUrl);
              return;
            }
          }
        }

        // Fallback: getSession() reads an existing session (if any) from the client.
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(data?.session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.error('auth init error', err);
        if (!mounted) return;
        setUser(null);
        setLoading(false);
      }
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

  async function refreshUser() {
    try {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user ?? null);
    } catch (err) {
      console.error('refreshUser error', err);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>{children}</AuthContext.Provider>
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
