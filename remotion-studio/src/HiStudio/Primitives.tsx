import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AR, EASE, FONT, HI, useLayout } from "./brand";
import type { Callout, Icon, Timings } from "./types";

const ease = Easing.bezier(...EASE);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Warm ivory base with slow drifting sage/gold light blooms + fine grain */
export const SoftBackground: React.FC<{ tone?: "ivory" | "tint" | "deep" }> = ({ tone = "ivory" }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const base = tone === "deep" ? HI.green : tone === "tint" ? HI.tint : HI.ivory;
  const blob = (cx: number, cy: number, r: number, color: string, sp: number, ph: number) => (
    <div
      style={{
        position: "absolute",
        left: cx * width + Math.sin(f / sp + ph) * width * 0.06 - r,
        top: cy * height + Math.cos(f / (sp * 1.3) + ph) * height * 0.04 - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(30px)",
      }}
    />
  );
  const R = Math.max(width, height) * 0.45;
  return (
    <AbsoluteFill style={{ background: base, overflow: "hidden" }}>
      {blob(0.8, 0.2, R, tone === "deep" ? "#58705f" : "rgba(130,151,134,0.28)", 90, 0)}
      {blob(0.15, 0.75, R * 0.9, tone === "deep" ? "rgba(181,154,104,0.25)" : "rgba(181,154,104,0.18)", 110, 2)}
      {blob(0.5, 0.5, R * 0.7, "rgba(255,255,255,0.35)", 70, 4)}
      <AbsoluteFill style={{ opacity: 0.05, mixBlendMode: "multiply" }}>
        <svg width="100%" height="100%">
          <filter id="hi-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /></filter>
          <rect width="100%" height="100%" filter="url(#hi-grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Frosted glass panel */
export const Glass: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; dark?: boolean }> = ({ children, style, dark }) => {
  const { u } = useLayout();
  return (
    <div
      style={{
        background: dark ? "rgba(41,50,45,0.35)" : "rgba(255,255,255,0.55)",
        border: `${1.5 * u}px solid ${dark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.9)"}`,
        boxShadow: `0 ${20 * u}px ${60 * u}px rgba(41,50,45,0.10), inset 0 ${1 * u}px 0 rgba(255,255,255,0.6)`,
        backdropFilter: `blur(${24 * u}px)`,
        borderRadius: 34 * u,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Apple-style dynamic headline: words rise from blur into focus, *key* word in green with a gold underline */
export const Headline: React.FC<{ text: string; size?: number; color?: string; delay?: number; align?: "center" | "right"; maxWidth?: number }> = ({
  text,
  size,
  color = HI.text,
  delay = 0,
  align = "center",
  maxWidth,
}) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const words = text.split(/\s+/).filter(Boolean);
  const fs = size ?? L.h1;
  return (
    <div
      style={{
        direction: "rtl",
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: fs,
        lineHeight: 1.28,
        color,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: `${fs * 0.1}px ${fs * 0.26}px`,
        maxWidth: maxWidth ?? L.width - L.safeX * 2,
        textAlign: align,
      }}
    >
      {words.map((raw, i) => {
        // *word* (optionally followed by punctuation, e.g. *تعبان*؟) = key word
        const m = raw.match(/^\*(.+)\*([؟?!.،,:]*)$/);
        const key = !!m;
        const w = m ? m[1] : raw;
        const tail = m ? m[2] : "";
        const p = interpolate(f - delay - i * 4, [0, 22], [0, 1], { ...clamp, easing: ease });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              filter: `blur(${(1 - p) * 14}px)`,
              transform: `translateY(${(1 - p) * fs * 0.45}px)`,
              color: key ? HI.green : undefined,
              position: "relative",
            }}
          >
            {w}
            {key ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: -fs * 0.06,
                  height: Math.max(2, fs * 0.05),
                  background: HI.gold,
                  transformOrigin: "right",
                  transform: `scaleX(${interpolate(f - delay - i * 4 - 14, [0, 18], [0, 1], { ...clamp, easing: ease })})`,
                }}
              />
            ) : null}
            {tail ? <span style={{ color }}>{tail}</span> : null}
          </span>
        );
      })}
    </div>
  );
};

/** Captions synced to the VO: each line is split into short chunks timed proportionally to word count */
export const Captions: React.FC<{ timings: Timings; dark?: boolean }> = ({ timings, dark }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const t = f / fps;
  const line = timings.lines.find((l) => t >= l.start - 0.05 && t <= l.end + 0.15);
  if (!line) return null;
  const words = line.text.replace(/\.\.\./g, "…").split(/\s+/).filter(Boolean);
  const per = L.landscape ? 9 : 6;
  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += per) chunks.push(words.slice(i, i + per));
  const frac = Math.min(0.999, Math.max(0, (t - line.start) / Math.max(0.1, line.end - line.start)));
  // chunk boundaries weighted by word count
  let acc = 0;
  let idx = 0;
  for (let i = 0; i < chunks.length; i++) {
    acc += chunks[i].length / words.length;
    if (frac < acc) { idx = i; break; }
    idx = i;
  }
  const chunkStart = line.start + (chunks.slice(0, idx).reduce((a, c) => a + c.length, 0) / words.length) * (line.end - line.start);
  const appear = interpolate(t - chunkStart, [0, 0.18], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: L.safeX,
        right: L.safeX,
        bottom: L.portrait ? L.safeBottom - 40 * L.u : L.safeBottom,
        display: "flex",
        justifyContent: "center",
        direction: "rtl",
        opacity: appear,
        transform: `translateY(${(1 - appear) * 10 * L.u}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: L.body * 1.05,
          lineHeight: 1.45,
          color: dark ? HI.white : HI.text,
          background: dark ? "rgba(41,50,45,0.55)" : "rgba(247,246,240,0.82)",
          backdropFilter: "blur(12px)",
          padding: `${10 * L.u}px ${26 * L.u}px`,
          borderRadius: 18 * L.u,
          textAlign: "center",
        }}
      >
        {chunks[idx].join(" ")}
      </div>
    </div>
  );
};

/** Animated medical callouts: pulsing dot → drawn leader line → label in a glass pill */
export const Callouts: React.FC<{ items: Callout[]; dark?: boolean; trackData?: Record<string, { x: number; y: number }[]> }> = ({ items, dark, trackData }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const L = useLayout();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {items.map((c, i) => {
        const start = Math.round((c.at ?? 0.6 + i * 0.5) * fps);
        const p = interpolate(f - start, [0, 20], [0, 1], { ...clamp, easing: ease });
        const tr = c.track && trackData?.[c.track];
        const pt = tr ? tr[Math.min(f, tr.length - 1)] : { x: c.x, y: c.y };
        const x = pt.x * width;
        const y = pt.y * height;
        const side = c.side ?? (pt.x > 0.5 ? "left" : "right");
        const len = 140 * L.u;
        const ex = side === "left" ? x - len : x + len;
        const ey = y - 70 * L.u;
        const pulse = 1 + 0.25 * Math.sin((f - start) / 6);
        return (
          <React.Fragment key={i}>
            <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
              <circle cx={x} cy={y} r={14 * L.u * pulse * p} fill="none" stroke={HI.gold} strokeWidth={2 * L.u} opacity={0.6 * p} />
              <circle cx={x} cy={y} r={6 * L.u * p} fill={HI.gold} />
              <line x1={x} y1={y} x2={x + (ex - x) * p} y2={y + (ey - y) * p} stroke={HI.gold} strokeWidth={2 * L.u} />
            </svg>
            <div
              style={{
                position: "absolute",
                top: ey - 30 * L.u,
                ...(side === "left" ? { right: width - ex + 8 * L.u } : { left: ex + 8 * L.u }),
                opacity: interpolate(f - start - 12, [0, 14], [0, 1], clamp),
                fontFamily: AR,
                fontWeight: 600,
                fontSize: L.body * 0.85,
                color: dark ? HI.white : HI.text,
                background: dark ? "rgba(41,50,45,0.5)" : "rgba(255,255,255,0.75)",
                border: `1px solid ${dark ? "rgba(255,255,255,0.25)" : "rgba(181,154,104,0.5)"}`,
                backdropFilter: "blur(10px)",
                padding: `${8 * L.u}px ${20 * L.u}px`,
                borderRadius: 999,
                direction: "rtl",
                whiteSpace: "nowrap",
              }}
            >
              {c.label}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/** Diagonal soft light band passing across the frame */
export const LightSweep: React.FC<{ delay?: number; duration?: number; strength?: number }> = ({ delay = 0, duration = 40, strength = 0.55 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f - delay, [0, duration], [-0.4, 1.4], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  if (p <= -0.4 || p >= 1.4) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: "-50%",
          bottom: "-50%",
          left: `${p * 100}%`,
          width: "22%",
          transform: "rotate(18deg)",
          background: `linear-gradient(90deg, transparent, rgba(255,246,225,${strength}), transparent)`,
          filter: "blur(18px)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Thin-line icon set (stroke = currentColor) */
export const IconSvg: React.FC<{ name: Icon; size: number; color?: string }> = ({ name, size, color = HI.green }) => {
  const p: Record<Icon, React.ReactNode> = {
    energy: (<><rect x="6" y="18" width="46" height="28" rx="6" /><rect x="52" y="26" width="6" height="12" rx="2" /><path d="M30 22 l-8 11 h9 l-6 10" /></>),
    sleep: (<><path d="M40 10 a22 22 0 1 0 14 34 a18 18 0 0 1 -14 -34z" /><path d="M46 14 h8 l-8 9 h8" /></>),
    focus: (<><circle cx="32" cy="32" r="22" /><circle cx="32" cy="32" r="12" /><circle cx="32" cy="32" r="3" /></>),
    scan: (<><path d="M8 20 v-10 h10 M46 10 h10 v10 M56 44 v10 h-10 M18 54 h-10 v-10" /><path d="M8 32 h48" /></>),
    nutrition: (<><path d="M32 54 c-14 0 -22 -10 -22 -22 c0 -10 7 -16 14 -16 c4 0 6 2 8 2 s4 -2 8 -2 c7 0 14 6 14 16 c0 12 -8 22 -22 22z" /><path d="M32 18 c0 -6 4 -10 10 -10" /></>),
    lifestyle: (<><circle cx="36" cy="10" r="5" /><path d="M30 20 l-8 14 l10 4 l-4 18 M30 20 l10 8 l10 -2 M32 38 l12 6 l4 12" /></>),
    doctor: (<><circle cx="32" cy="16" r="9" /><path d="M14 56 c0 -12 8 -20 18 -20 s18 8 18 20" /><path d="M24 38 v8 a6 6 0 0 0 12 0" /><circle cx="42" cy="46" r="3" /></>),
    heart: (<><path d="M32 54 c-16 -10 -24 -19 -24 -29 c0 -8 6 -14 13 -14 c5 0 9 3 11 7 c2 -4 6 -7 11 -7 c7 0 13 6 13 14 c0 10 -8 19 -24 29z" /><path d="M14 30 h10 l4 -6 l6 12 l4 -6 h12" /></>),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      {p[name]}
    </svg>
  );
};

/** Corner brand mark shown on every frame (except the end card, which shows it large) */
export const CornerLogo: React.FC = () => {
  const L = useLayout();
  const size = (L.portrait ? 118 : 104) * L.u;
  return (
    <Img
      src={staticFile("brand/logo-badge.png")}
      style={{
        position: "absolute",
        width: size,
        height: size,
        top: L.portrait ? 120 * L.u : 48 * L.u,
        left: L.portrait ? 60 * L.u : 56 * L.u,
        opacity: 0.96,
        filter: "drop-shadow(0 6px 18px rgba(41,50,45,0.12))",
      }}
    />
  );
};
