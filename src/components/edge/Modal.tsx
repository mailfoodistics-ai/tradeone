import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 grid place-items-center px-4 py-8 overflow-y-auto"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full ${maxWidth} rounded-3xl glass-strong glow-ring p-6`}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                {subtitle && <p className="mt-1 text-[12.5px] text-white/55">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 grid place-items-center rounded-lg glass hover:bg-white/[0.08] transition"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  placeholder?: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-1.5">{label}</div>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5 text-[13.5px] placeholder:text-white/30 focus:outline-none focus:border-primary/40 focus:bg-white/[0.05] transition"
      />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  // clone option children to inject dark styles where possible
  const injectedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    if (typeof child.type === 'string' && child.type === 'option') {
      const props = (child.props || {}) as any;
      return React.cloneElement(child as any, {
        style: { backgroundColor: 'var(--color-popover)', color: 'var(--color-foreground)', ...(props.style || {}) },
      } as any);
    }
    return child;
  });

  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-1.5">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // use inline styles to encourage dark background on native controls
        style={{ backgroundColor: 'var(--color-popover)', color: 'var(--color-foreground)' }}
        className="w-full rounded-xl border border-white/10 px-3 py-2.5 text-[13.5px] focus:outline-none focus:border-primary/40 transition"
      >
        {injectedChildren}
      </select>
    </label>
  );
}
