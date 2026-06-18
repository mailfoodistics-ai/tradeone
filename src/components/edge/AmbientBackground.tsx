import { motion } from "framer-motion";

export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden noise">
      {/* Base */}
      <div className="absolute inset-0 bg-background" />

      {/* Mesh blobs */}
      <motion.div
        aria-hidden
        className="absolute -top-40 left-1/3 h-[60rem] w-[60rem] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, oklch(0.87 0.22 152 / 0.18), transparent 60%)" }}
        animate={{ x: [0, 60, -40, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/2 -right-40 h-[50rem] w-[50rem] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, oklch(0.74 0.16 165 / 0.14), transparent 60%)" }}
        animate={{ x: [0, -50, 30, 0], y: [0, 40, -20, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 left-0 h-[50rem] w-[50rem] rounded-full blur-[160px]"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.19 158 / 0.12), transparent 60%)" }}
        animate={{ x: [0, 40, -20, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      {Array.from({ length: 24 }).map((_, i) => {
        const left = (i * 137) % 100;
        const top = (i * 53) % 100;
        const dur = 10 + (i % 6) * 2;
        const size = 1 + (i % 3);
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-primary/40"
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, boxShadow: "0 0 8px oklch(0.87 0.22 152 / 0.7)" }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: dur, repeat: Infinity, ease: "easeInOut", delay: (i % 5) * 0.6 }}
          />
        );
      })}

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black, transparent 75%)",
        }}
      />
    </div>
  );
}
