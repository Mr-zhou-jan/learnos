"use client";
import { useRef, useEffect } from "react";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const el = ref.current; if (!el) return;
    el.style.opacity = "0"; el.style.transform = "translateY(8px)";
    el.style.transition = "opacity 0.2s ease-out, transform 0.2s ease-out";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.opacity = "1"; el.style.transform = "translateY(0)";
    }));
  });

  return <div ref={ref}>{children}</div>;
}
