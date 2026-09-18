import type { ReactNode } from "react";
import { MartenIllustration } from "./MartenIllustration";
import "./marten.css";

export function MartenNote({ children }: { children: ReactNode }) {
  return <div className="marten-note"><MartenIllustration className="marten-note__figure"/><p><span className="marten-note__name">Marten</span>{children}</p></div>;
}
