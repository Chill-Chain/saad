import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY, C, DISPLAY, pad2, type Bg, fgColor } from "./theme";

/** Top progress dashes + chapter label + side handle */
export const Chrome: React.FC<{ bg: Bg; chapter?: number; chapters: string[]; handle: string }> = ({
  bg,
  chapter,
  chapters,
  handle,
}) => {
  const fg = fgColor(bg);
  const dim = bg === "paper" ? C.muted : "rgba(235,235,230,0.25)";
  const label = chapter ? `${pad2(chapter)} · ${chapters[chapter - 1] ?? ""}` : "";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 120, left: 90, display: "flex", gap: 10, direction: "rtl" }}>
        {chapters.map((_, i) => {
          const idx = i + 1;
          const color = chapter === idx ? C.red : chapter && idx < chapter ? fg : dim;
          return <div key={i} style={{ width: 46, height: 5, borderRadius: 3, background: color }} />;
        })}
      </div>
      {label ? (
        <div style={{ position: "absolute", top: 104, right: 90, fontFamily: BODY, fontWeight: 600, fontSize: 26, color: fg, opacity: 0.75, direction: "rtl" }}>
          {label}
        </div>
      ) : null}
      {handle ? (
        <div style={{ position: "absolute", left: 34, top: "50%", transform: "translateY(-50%) rotate(-90deg)", fontFamily: BODY, fontSize: 20, color: fg, opacity: 0.3, direction: "ltr" }}>
          {handle}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Word-by-word caption, top-right. *word* = red highlight box */
export const Caption: React.FC<{ text: string; bg: Bg }> = ({ text, bg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fg = fgColor(bg);
  const words = text.split(/\s+/).filter(Boolean);
  const perWord = 5;
  return (
    <div style={{ position: "absolute", top: 190, right: 90, left: 90, direction: "rtl", display: "flex", flexWrap: "wrap", gap: "10px 18px", fontFamily: DISPLAY, fontWeight: 800, fontSize: 70, lineHeight: 1.25, color: fg }}>
      {words.map((raw, i) => {
        const hl = /^\*.*\*$/.test(raw);
        const w = hl ? raw.slice(1, -1) : raw;
        const start = 4 + i * perWord;
        const s = spring({ frame: frame - start, fps, config: { damping: 200 }, durationInFrames: 8 });
        const pop = hl ? spring({ frame: frame - start, fps, config: { damping: 12, stiffness: 180 } }) : s;
        return (
          <span
            key={i}
            style={{
              opacity: s,
              transform: `translateY(${interpolate(s, [0, 1], [14, 0])}px) scale(${hl ? interpolate(pop, [0, 1], [0.7, 1]) : 1})`,
              display: "inline-block",
              ...(hl ? { background: C.red, color: C.ink, padding: "0 16px", borderRadius: 8 } : {}),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};
