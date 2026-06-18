import { Link, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { AmbientBackground } from "@/components/edge/AmbientBackground";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useSetups } from "@/lib/store/journalStore";

type NavItem = { to: string; label: string; icon: ReactNode };

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: <Icon d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 9h8V3h-8z" /> },
  { to: "/app/journal", label: "Journal", icon: <Icon d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3zM8 8h8M8 12h8M8 16h5" /> },
  { to: "/app/setups", label: "Setups", icon: <Icon d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 14.8 7.1 17.2 8 11.7 4 7.8 9.5 7z" /> },
  { to: "/app/analytics", label: "Analytics", icon: <Icon d="M3 3v18h18M7 15l4-4 3 3 5-6" /> },
  { to: "/app/calendar", label: "Calendar", icon: <Icon d="M3 6h18M5 6V4m14 2V4M3 10h18v10H3zM8 14h.01M12 14h.01M16 14h.01" /> },
  { to: "/app/propfirm", label: "Prop Firm", icon: <Icon d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6" /> },
];

export default function AppShell() {
  const loc = useLocation();
  const { user } = useAuth();
  const SETUPS = useSetups();
  const bestSetup = [...SETUPS].sort((a,b)=> (b.profit ?? 0) - (a.profit ?? 0))[0];
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Trader';
  const displayEmail = user?.email ?? '';
  const initial = (displayName && displayName[0]) || 'T';

  return (
    <div className="relative min-h-screen text-foreground">
      <AmbientBackground />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 lg:flex flex-col border-r border-white/5 bg-black/30 backdrop-blur-xl">
        <div className="px-5 py-5 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
              <span className="absolute inset-0 rounded-lg blur-md bg-primary/30" />
              <svg viewBox="0 0 24 24" className="relative h-4 w-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17l5-5 4 4 8-9" /><path d="M14 7h6v6" />
              </svg>
            </span>
            <span className="text-[14px] font-semibold tracking-tight">
              TradeOne
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.18em] text-white/35">Workspace</div>
          {NAV.map((item) => {
            const active = loc.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ${
                  active ? "bg-white/[0.06] text-white" : "text-white/60 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_oklch(0.87_0.22_152)]"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className={active ? "text-primary" : "text-white/50"}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-2xl glass p-3">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-primary/80">Setup Intelligence</div>
          <div className="mt-1 text-[12.5px] text-white/70 leading-relaxed">
            {bestSetup ? (
              <>Your edge concentrates in <span className="text-white">{bestSetup.name}</span>.</>
            ) : (
              <>Your edge will appear here after logging some trades.</>
            )}
          </div>
          <Link to="/app/analytics" className="mt-2 inline-flex items-center gap-1 text-[12px] text-primary hover:underline">
            View insight
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </Link>
        </div>

        <Link to="/app/profile" className="m-3 mt-0 flex items-center gap-2.5 rounded-xl glass p-2.5 hover:bg-white/[0.07] transition">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent-tertiary text-[11px] font-semibold text-primary-foreground grid place-items-center">{initial}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] truncate">{displayName}</div>
            <div className="text-[10.5px] text-white/45 truncate">{displayEmail}</div>
          </div>
        </Link>
      </aside>

      {/* Main */}
      <div className="lg:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/5 bg-background/60 backdrop-blur-xl px-4 py-3 md:px-8">
          <div className="flex items-center gap-3 flex-1 min-w-0" />
        </header>

        <main className="px-4 md:px-8 py-6 md:py-8 pb-28 lg:pb-10">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 lg:hidden">
          <div className="glass-strong flex items-center gap-1 rounded-2xl px-2 py-1.5">
            {NAV.slice(0,4).map((item) => {
              const active = loc.pathname.startsWith(item.to);
              return (
                <Link key={item.to} to={item.to} className={`px-3 py-2 rounded-xl text-[11px] flex flex-col items-center gap-0.5 ${active?"text-primary":"text-white/55"}`}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link to="/app/journal/new" className="ml-1 grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_24px_-2px_oklch(0.87_0.22_152/0.7)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
