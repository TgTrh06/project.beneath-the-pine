import type { ReactNode } from "react";
import { MartenIllustration } from "./MartenIllustration";
import "./marten.css";

export function MartenNote({ children, pose = "sit" }: { children: ReactNode; pose?: "sit" | "stretch" }) {
  return <div className="marten-note"><MartenIllustration className={`marten-note__figure marten-note__figure--${pose}`} pose={pose}/><p><span className="marten-note__name">Marten</span>{children}</p></div>;
}
