import { useEffect, useRef } from "react";

export function useRevealOnce() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || motion.matches || !("IntersectionObserver" in window)) return;
    const nodes = root.querySelectorAll<HTMLElement>(".lp-how, .lp-return-inner, .lp-principles, .lp-before, .lp-closing");
    // Content stays visible before and after observation; only its entrance animates.
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("lp-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    nodes.forEach((node) => observer.observe(node));
    const stop = () => { if (motion.matches) observer.disconnect(); };
    motion.addEventListener("change", stop);
    return () => { observer.disconnect(); motion.removeEventListener("change", stop); nodes.forEach((node) => node.classList.remove("lp-revealed")); };
  }, []);
  return ref;
}
