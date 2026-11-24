import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

/**
 * Brand logo — must appear in EVERY composition rendered from this project.
 * Drop <BrandLogo /> as the last child of a composition's root so it sits on top.
 * Files: public/brand/logo-badge.png (round, readable on any background) and logo.png (transparent).
 */
export const BrandLogo: React.FC<{
  size?: number;
  position?: "top-center" | "top-right" | "top-left" | "bottom-right";
  variant?: "badge" | "transparent";
  opacity?: number;
}> = ({ size = 120, position = "top-right", variant = "badge", opacity = 0.95 }) => {
  const pos: React.CSSProperties =
    position === "top-center"
      ? { top: 60, left: "50%", transform: "translateX(-50%)" }
      : position === "top-left"
        ? { top: 60, left: 60 }
        : position === "bottom-right"
          ? { bottom: 60, right: 60 }
          : { top: 60, right: 60 };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Img
        src={staticFile(variant === "badge" ? "brand/logo-badge.png" : "brand/logo.png")}
        style={{ position: "absolute", width: size, height: "auto", opacity, ...pos }}
      />
    </AbsoluteFill>
  );
};

/** Large logo for end cards */
export const BrandMark: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 260, style }) => (
  <Img src={staticFile("brand/logo-badge.png")} style={{ width: size, height: "auto", ...style }} />
);
