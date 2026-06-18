import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, PageHeader } from "@/components/edge/ui";
import { useAuth } from "@/lib/auth";

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Trader';
  const displayEmail = user?.email ?? '';
  const initial = (displayName && displayName[0]) || 'T';

  return (
    <>
      <PageHeader eyebrow="Profile" title="Your account" subtitle="Manage your personal details and security." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="!p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent-tertiary grid place-items-center text-primary-foreground text-lg font-semibold">{initial}</div>
            <div>
              <div className="text-base font-semibold">{displayName}</div>
              <div className="text-[12px] text-white/55">{displayEmail}</div>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            <button className="w-full rounded-xl glass px-3 py-2 text-[12.5px] text-white/80 hover:bg-white/[0.07] transition">Edit profile</button>
            <button onClick={async ()=>{ await signOut(); navigate('/login'); }} className="w-full rounded-xl bg-destructive/15 border border-destructive/30 px-3 py-2 text-[12.5px] text-destructive hover:bg-destructive/20 transition">Sign out</button>
          </div>
        </Card>

        <Card className="!p-5 lg:col-span-2">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-3">About</div>
          <p className="text-[13px] text-white/70">This profile contains your public display name and email. You can edit your name and preferences here. Integrations and export options are available in the Integrations section (coming soon).</p>
        </Card>
      </div>
    </>
  );
}
