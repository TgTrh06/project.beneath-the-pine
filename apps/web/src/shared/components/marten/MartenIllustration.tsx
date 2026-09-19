import { useEffect, useRef } from "react";

/** Decorative only: pointer tracking never captures clicks or stores input. */
export function MartenIllustration({ className, trackPointer = false }: { className?: string; trackPointer?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);
  useEffect(() => {
    const svg = svgRef.current;
    const pupils = pupilsRef.current;
    if (!svg || !pupils || !trackPointer) return;
    const allowed = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let x = 0;
    let y = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      pupils.setAttribute("transform", "translate(0 0)");
    };
    const move = (event: PointerEvent) => {
      if (!allowed.matches || event.pointerType !== "mouse") { reset(); return; }
      x = event.clientX;
      y = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const bounds = svg.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > window.innerHeight) { reset(); return; }
        const dx = x - (bounds.left + bounds.width / 2);
        const dy = y - (bounds.top + bounds.height * 0.48);
        const length = Math.hypot(dx, dy);
        const scale = Math.min(length / 140, 1);
        pupils.setAttribute("transform", `translate(${length ? dx / length * 2.4 * scale : 0} ${length ? dy / length * 2 * scale : 0})`);
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    window.addEventListener("scroll", reset, { passive: true });
    allowed.addEventListener("change", reset);
    return () => {
      reset();
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      window.removeEventListener("scroll", reset);
      allowed.removeEventListener("change", reset);
    };
  }, [trackPointer]);
  return <svg ref={svgRef} className={className} viewBox="0 0 160 104" fill="none" aria-hidden="true" focusable="false">
    <g stroke="#30241F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <g className="lp-marten-head">
        <path d="M43 37C24 31 29 9 42 11C51 12 55 22 53 29M107 29C105 22 109 12 118 11C131 9 136 31 117 37" fill="#875438" />
        <path d="M42 28C35 24 36 17 42 18C47 19 48 24 47 28M113 28C112 24 113 19 118 18C124 17 125 24 118 28" fill="#F2D6A2" strokeWidth="1.5" />
        <path d="M40 49C40 30 58 23 80 25C102 23 120 30 120 49L125 61L117 60C113 77 96 82 80 82C64 82 47 77 43 60L35 61Z" fill="#875438" />
        <path d="M51 41C61 31 70 33 80 37C90 33 99 31 109 41C96 39 88 43 80 51C72 43 64 39 51 41Z" fill="#B77B50" stroke="none" />
        <path d="M52 63C54 55 68 56 80 61C92 56 106 55 108 63C108 72 94 78 80 77C66 78 52 72 52 63Z" fill="#F2D6A2" strokeWidth="1.5" />
        <ellipse cx="62" cy="50" rx="7" ry="8" fill="#FFF8EC" strokeWidth="1.5" />
        <ellipse cx="98" cy="50" rx="7" ry="8" fill="#FFF8EC" strokeWidth="1.5" />
        <g ref={pupilsRef} fill="#30241F" stroke="none">
          <ellipse cx="62" cy="51" rx="3.2" ry="4" /><ellipse cx="98" cy="51" rx="3.2" ry="4" />
          <circle cx="63" cy="49.5" r="1" fill="#FFF8EC" /><circle cx="99" cy="49.5" r="1" fill="#FFF8EC" />
        </g>
        <path d="M73 61Q80 57 87 61Q86 66 80 67Q74 66 73 61Z" fill="#30241F" strokeWidth="1.5" />
        <path d="M80 67v3M72 70Q76 74 80 70Q84 74 88 70" strokeWidth="1.5" />
      </g>
      <g className="lp-marten-paws" fill="#875438">
        <path d="M39 80C36 72 24 74 23 82L22 90C22 100 43 100 44 90L44 85Z" />
        <path d="M121 80C124 72 136 74 137 82L138 90C138 100 117 100 116 90L116 85Z" />
        <path d="M27 84Q33 80 39 84M121 84Q127 80 133 84" stroke="#B77B50" strokeWidth="3" />
        <path d="M29 91v5M36 91v5M124 91v5M131 91v5" strokeWidth="1.5" />
      </g>
    </g>
  </svg>;
}
