import React from "react";
import { AbsoluteFill } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { C } from "./theme";

type P = Record<string, unknown>;

/** Signature transition: a red vertical line sweeps right→left, revealing the next scene behind it */
const RedWipeComponent: React.FC<TransitionPresentationComponentProps<P>> = ({ children, presentationDirection, presentationProgress }) => {
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;
  const p = Math.min(1, presentationProgress);
  const edge = (1 - p) * 100;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${edge}%)` }}>{children}</AbsoluteFill>
      {p < 1 ? <div style={{ position: "absolute", top: 0, bottom: 0, left: `calc(${edge}% - 4px)`, width: 8, background: C.red }} /> : null}
    </AbsoluteFill>
  );
};

export const redWipe = (): TransitionPresentation<P> => ({ component: RedWipeComponent, props: {} });
