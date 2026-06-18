import React from "react";
// Converted from TanStack route to plain React component
import { AmbientBackground } from "@/components/edge/AmbientBackground";
import { Nav } from "@/components/edge/Nav";
import { Hero } from "@/components/edge/Hero";
import { Features } from "@/components/edge/Features";
import { SetupIntelligence } from "@/components/edge/SetupIntelligence";
import { DashboardPreview } from "@/components/edge/DashboardPreview";
import { CTA } from "@/components/edge/CTA";

export default function Landing() {
  return (
    <main className="relative min-h-screen text-foreground">
      <AmbientBackground />
      <Nav />
      <Hero />
      <Features />
      <SetupIntelligence />
      <DashboardPreview />
      <CTA />
    </main>
  );
}
