import { useEffect, useRef } from "react";

type MartenPose = "peek" | "sit" | "loaf" | "look-right" | "curl" | "stretch" | "perch" | "nap";

const sprites: Record<MartenPose, string> = {
  peek: "/marten/marten-look-right.png",
  sit: "/marten/marten-sit.png",
  loaf: "/marten/marten-stretch.png",
  "look-right": "/marten/marten-look-right.png",
  curl: "/marten/marten-curl.png",
  stretch: "/marten/marten-stretch.png",
  perch: "/marten/marten-perch.png",
  nap: "/marten/marten-nap.png",
};

/** Exact transparent sprite crops from the user's supplied Marten reference sheet. */
export function MartenIllustration({ className, pose = "peek", trackPointer = false }: { className?: string; pose?: MartenPose; trackPointer?: boolean }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const pupilRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    const pupil = pupilRef.current;
    if (!trackPointer || pose !== "peek" || !root || !pupil) return;
    const allowed = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let x = 0;
    let y = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      pupil.style.transform = "translate(0, 0)";
    };
    const move = (event: PointerEvent) => {
      if (!allowed.matches || event.pointerType !== "mouse") { reset(); return; }
      x = event.clientX;
      y = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const bounds = root.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > window.innerHeight) { reset(); return; }
        const dx = x - (bounds.left + bounds.width * .5);
        const dy = y - (bounds.top + bounds.height * .5);
        pupil.style.transform = `translate(${Math.max(-1.5, Math.min(1.5, dx / 120 * 1.5))}px, ${Math.max(-1.25, Math.min(1.25, dy / 120 * 1.25))}px)`;
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
  }, [pose, trackPointer]);

  const followsPointer = trackPointer && pose === "peek";
  const src = followsPointer ? "/marten/marten-look-right-tracked.png" : sprites[pose];
  return <span ref={rootRef} className={`marten-illustration ${className ?? ""}`} aria-hidden="true">
    <img className="marten-illustration__sprite" src={src} alt="" draggable={false} />
    {followsPointer && <span ref={pupilRef} className="marten-illustration__pupil" />}
  </span>;
}
