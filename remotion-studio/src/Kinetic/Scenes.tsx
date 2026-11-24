import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { BrandMark } from "../Brand";
import { BODY, C, DISPLAY, pad2, type Bg, fgColor } from "./theme";
import type { Scene } from "./types";

const center: React.CSSProperties = { justifyContent: "center", alignItems: "center", direction: "rtl" };
const useSpring = (delay = 0, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness: 170 } });
};

/* 1) Hook: a big word in a red block + numbered boxes that fill in */
export const Hook: React.FC<{ s: Extract<Scene, { type: "hook" }>; bg: Bg }> = ({ s }) => {
  const frame = useCurrentFrame();
  const pop = useSpring(0, 11);
  const boxes = s.boxes ?? 0;
  return (
    <AbsoluteFill style={{ ...center, top: -80 }}>
      <div style={{ background: C.red, color: C.ink, fontFamily: DISPLAY, fontWeight: 900, fontSize: 150, padding: "0 46px 14px", borderRadius: 14, transform: `scale(${interpolate(pop, [0, 1], [1.35, 1])}) rotate(${interpolate(pop, [0, 1], [-3, 0])}deg)` }}>
        {s.word}
      </div>
      {boxes > 0 ? (
        <div style={{ position: "absolute", bottom: 560, display: "flex", gap: 18, direction: "rtl" }}>
          {Array.from({ length: boxes }).map((_, i) => {
            const t = spring({ frame: frame - 18 - i * 5, fps: 30, config: { damping: 14 } });
            const first = i === 0;
            return (
              <div key={i} style={{ width: 92, height: 120, borderRadius: 12, border: `3px solid ${C.ink}`, background: first ? C.red : "transparent", opacity: t, transform: `translateY(${(1 - t) * 30}px)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 800, color: C.ink }}>
                <span style={{ fontSize: 22 }}>{pad2(i + 1)}</span>
                <span style={{ fontSize: 44 }}>؟</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* 2) Chapter card: kicker + huge number + title + red underline */
export const Chapter: React.FC<{ s: Extract<Scene, { type: "chapter" }>; bg: Bg }> = ({ s, bg }) => {
  const fg = fgColor(bg);
  const a = useSpring(0, 16);
  const b = useSpring(6, 200);
  const line = useSpring(10, 200);
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column" }}>
      <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 34, color: fg, opacity: 0.6 * b }}>{s.kicker}</div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 300, lineHeight: 1, color: fg, direction: "ltr", transform: `scale(${interpolate(a, [0, 1], [0.6, 1])})`, opacity: a }}>{s.number}</div>
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 52, color: fg, opacity: b, marginTop: 20 }}>{s.title}</div>
      <div style={{ width: 90 * line, height: 6, background: C.red, borderRadius: 3, marginTop: 22 }} />
    </AbsoluteFill>
  );
};

/* 3) Word cut: letters revealed one by one + a mini editing timeline with a playhead */
export const WordCut: React.FC<{ s: Extract<Scene, { type: "word" }>; bg: Bg }> = ({ s, bg }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fg = fgColor(bg);
  const chars = Array.from(s.word);
  const shown = Math.min(chars.length, Math.floor(interpolate(frame, [4, 4 + chars.length * 4], [1, chars.length + 0.99], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const head = interpolate(frame, [0, durationInFrames], [0.15, 0.85]);
  const tc = `00:${pad2(Math.floor(frame / 30))}:${pad2(frame % 30)}`;
  return (
    <AbsoluteFill style={center}>
      <div style={{ position: "absolute", top: 640, fontFamily: BODY, fontSize: 22, letterSpacing: 6, color: fg, opacity: 0.4, direction: "ltr" }}>CUT {pad2(shown)}</div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 260, color: fg }}>{chars.slice(0, shown).join("")}</div>
      <div style={{ position: "absolute", bottom: 560, left: 140, right: 140, height: 3, background: fg, opacity: 0.35, direction: "ltr" }}>
        <div style={{ position: "absolute", left: `${head * 100}%`, top: -60, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: BODY, fontSize: 18, color: fg, marginBottom: 6 }}>{tc}</div>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 90, height: 34, border: `2px solid ${C.red}`, borderRadius: 4, fontFamily: BODY, fontSize: 16, color: fg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.word}</div>
            <div style={{ width: 22, height: 34, background: fg, borderRadius: 4 }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* 4) Stretch: kashida (ـ) grows inside the word with a measurement ruler */
export const Stretch: React.FC<{ s: Extract<Scene, { type: "stretch" }>; bg: Bg }> = ({ s, bg }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fg = fgColor(bg);
  const MAX = 8;
  const n = Math.round(interpolate(frame, [8, durationInFrames * 0.8], [0, MAX], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }));
  const chars = Array.from(s.word);
  const build = (k: number) => chars.slice(0, s.stretchAfter).join("") + "ـ".repeat(k) + chars.slice(s.stretchAfter).join("");
  // Size the word so its fully-stretched form still fits the frame
  const fontSize = Math.min(210, Math.floor((210 * 880) / measureText({ text: build(MAX), fontFamily: DISPLAY, fontWeight: "900", fontSize: 210 }).width));
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column" }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize, color: fg, whiteSpace: "nowrap" }}>{build(n)}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, direction: "ltr", marginTop: 10 }}>
        <div style={{ width: 3, height: 22, background: C.red }} />
        <div style={{ width: Math.max(4, n * 34), height: 3, background: C.red }} />
        <div style={{ width: 3, height: 22, background: C.red }} />
      </div>
      <div style={{ fontFamily: BODY, fontSize: 24, color: C.red, marginTop: 8, direction: "ltr" }}>+{n * 30}px</div>
    </AbsoluteFill>
  );
};

/* 5) Counter: number counts up with a segmented progress bar */
export const Counter: React.FC<{ s: Extract<Scene, { type: "counter" }>; bg: Bg }> = ({ s, bg }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fg = fgColor(bg);
  const p = interpolate(frame, [6, durationInFrames * 0.75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const segs = 18;
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column" }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 230, color: fg, direction: "ltr", fontVariantNumeric: "tabular-nums" }}>{Math.round(s.to * p).toLocaleString("en-US")}</div>
      <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 40, color: fg, opacity: 0.75 }}>{s.label}</div>
      <div style={{ display: "flex", gap: 6, marginTop: 70, padding: 8, border: `2px solid ${fg}33`, borderRadius: 6, direction: "ltr" }}>
        {Array.from({ length: segs }).map((_, i) => (
          <div key={i} style={{ width: 28, height: 44, borderRadius: 3, background: i < Math.round(p * segs) ? C.red : `${fg}22` }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* 6) Icon morph: one shape flips into another */
const Shape: React.FC<{ kind: "card" | "heart" | "star"; color: string }> = ({ kind, color }) => {
  if (kind === "card") return <div style={{ width: 230, height: 330, borderRadius: 30, background: color }} />;
  const d = kind === "heart"
    ? "M100 178 C 30 128, 0 88, 0 52 C 0 22, 24 0, 54 0 C 76 0, 92 12, 100 30 C 108 12, 124 0, 146 0 C 176 0, 200 22, 200 52 C 200 88, 170 128, 100 178 Z"
    : "M100 0 L124 70 L198 72 L139 116 L161 188 L100 145 L39 188 L61 116 L2 72 L76 70 Z";
  return <svg width={300} height={270} viewBox="0 0 200 180"><path d={d} fill={color} /></svg>;
};
export const IconMorph: React.FC<{ s: Extract<Scene, { type: "icon" }>; bg: Bg }> = ({ s, bg }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const fg = fgColor(bg);
  const mid = Math.round(durationInFrames * 0.45);
  const outP = interpolate(frame, [mid - 8, mid], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const inP = spring({ frame: frame - mid, fps, config: { damping: 10, stiffness: 160 } });
  const wobble = Math.sin(frame / 6) * 6;
  const showTo = frame >= mid;
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column" }}>
      <div style={{ height: 380, display: "flex", alignItems: "center", justifyContent: "center", transform: showTo ? `scale(${inP})` : `scale(${1 - outP}) rotate(${wobble + outP * 40}deg)` }}>
        <Shape kind={showTo ? s.to : s.from} color={showTo ? C.red : "#EE9A92"} />
      </div>
      <div style={{ fontFamily: BODY, fontSize: 34, color: fg, opacity: 0.6, marginTop: 40 }}>{showTo ? s.toLabel : s.fromLabel}</div>
    </AbsoluteFill>
  );
};

/* 7) End card: name + handle + two pills */
export const End: React.FC<{ s: Extract<Scene, { type: "end" }>; bg: Bg }> = ({ s, bg }) => {
  const fg = fgColor(bg);
  const a = useSpring(0, 13);
  const b = useSpring(10, 200);
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column" }}>
      <BrandMark size={260} style={{ marginBottom: 30, opacity: a, transform: `scale(${interpolate(a, [0, 1], [0.6, 1])})` }} />
      <div style={{ position: "relative", fontFamily: DISPLAY, fontWeight: 900, fontSize: 230, color: fg, transform: `scale(${interpolate(a, [0, 1], [0.7, 1])})`, opacity: a }}>
        {s.name}
        <div style={{ position: "absolute", top: 30, right: 40, width: 26, height: 26, background: C.red, transform: "rotate(45deg)" }} />
      </div>
      <div style={{ fontFamily: BODY, fontSize: 32, color: fg, opacity: 0.6 * b, direction: "ltr" }}>{s.handle}</div>
      <div style={{ display: "flex", gap: 16, marginTop: 50, opacity: b, transform: `translateY(${(1 - b) * 20}px)` }}>
        {s.pills.map((p, i) => (
          <div key={i} style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, padding: "10px 30px", borderRadius: 40, border: `2px solid ${i === 0 ? C.red : fg}`, background: i === 0 ? C.red : "transparent", color: fg }}>{p}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
