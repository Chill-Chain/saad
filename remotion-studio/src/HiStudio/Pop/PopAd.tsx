import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction } from "remotion";
import { AR, CONTACT, EASE, FONT, HI, LAT, useLayout } from "../brand";
import { clamp, CornerLogo, LightSweep } from "../Primitives";
import type { Sfx } from "../types";
import { Presenter3D, type Pose } from "./Presenter3D";

/*
  "Pop" style — dark kinetic TikTok format (word-by-word typography synced to the voice,
  glitch cuts, UI props). Built in Hidden Impact tokens: charcoal/deep-green base, ivory text, gold accents.
*/

export const FPS = 30;
const LEAD = 0.15;
const ease = Easing.bezier(...EASE);

export type PopProp =
  | { kind: "rec" }
  | { kind: "battery" }
  | { kind: "wrong"; note: string }
  | { kind: "stars"; labels: string[] }
  | { kind: "progress"; label: string }
  | { kind: "count"; to: number; unit: string }
  | { kind: "quote"; chips: string[] }
  | { kind: "price"; name: string; price: number; old: number }
  | { kind: "end"; cta: string; disclaimer?: string };

export type PopScene = {
  lines: number[];
  /** big on-screen text, revealed word by word with the voice. *word* = gold key word, | = line break */
  text?: string;
  /** small label above the text */
  kicker?: string;
  prop: PopProp;
  sfx?: Sfx;
  /** presenter pose for this scene */
  pose?: Pose;
};

export type PopProduction = { id: string; folder: string; music: string; musicVolume?: number; scenes: PopScene[] };

type Word = { w: string; start: number; end: number };
export type PopTimings = { duration: number; lines: { i: number; text: string; start: number; end: number; words?: Word[] }[] };
export type PopProps = { production: PopProduction; timings?: PopTimings };

/* ───────── background ───────── */
const rnd = (s: number) => {
  const x = Math.sin(s * 91.345) * 47453.53;
  return x - Math.floor(x);
};
const DarkBg: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 38%, ${HI.green} 0%, #33423A 45%, ${HI.text} 100%)` }}>
      {Array.from({ length: 26 }, (_, i) => {
        const x = rnd(i) * width;
        const y = ((rnd(i + 40) * height - f * (0.3 + rnd(i + 9) * 0.6)) % height + height) % height;
        const s = 2 + rnd(i + 3) * 5;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: i % 3 ? HI.ivory : HI.gold, opacity: 0.08 + rnd(i + 7) * 0.18 }} />;
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)" }} />
    </AbsoluteFill>
  );
};

/* ───────── glitch cut-in (first ~7 frames of each scene) ───────── */
const Glitch: React.FC<{ seed: number; children: React.ReactNode }> = ({ seed, children }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const on = f < 7;
  const jx = on ? (rnd(seed + f) - 0.5) * 40 : 0;
  return (
    <AbsoluteFill>
      {on ? (
        <AbsoluteFill style={{ transform: `translateX(${jx + 14}px)`, opacity: 0.35, filter: "sepia(1) saturate(3) hue-rotate(5deg)" }}>{children}</AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ transform: `translateX(${jx}px)` }}>{children}</AbsoluteFill>
      {on
        ? Array.from({ length: 5 }, (_, i) => {
            const y = rnd(seed * 3 + i * 7 + f) * height;
            const h = 6 + rnd(seed + i + f * 2) * 34;
            const c = [HI.gold, HI.ivory, HI.sage][i % 3];
            return <div key={i} style={{ position: "absolute", top: y, left: (rnd(i + f) - 0.3) * width * 0.4, width: width * (0.5 + rnd(i * 5 + f) * 0.6), height: h, background: c, opacity: 0.55 }} />;
          })
        : null}
    </AbsoluteFill>
  );
};

/* ───────── kinetic words synced to the voice ───────── */
const Kinetic: React.FC<{ text: string; times: number[]; sceneStart: number; kicker?: string }> = ({ text, times, sceneStart, kicker }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const rows = text.split("|").map((r) => r.trim().split(/\s+/).filter(Boolean));
  const fs = L.h1 * 1.25;
  let k = -1;
  let inKey = false; // *key phrase* may span several words
  const kp = interpolate(f, [0, 12], [0, 1], { ...clamp, easing: ease });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: fs * 0.08, direction: "rtl" }}>
      {kicker ? <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: L.body * 1.05, color: HI.sage, opacity: kp, marginBottom: 8 * L.u }}>{kicker}</div> : null}
      {rows.map((ws, r) => (
        <div key={r} style={{ display: "flex", gap: fs * 0.26, justifyContent: "center", flexWrap: "wrap", maxWidth: L.width - L.safeX * 2 }}>
          {ws.map((raw) => {
            k++;
            const opens = raw.startsWith("*");
            const closes = /\*[؟?!.،,:]*$/.test(raw);
            const m = inKey || opens;
            if (opens) inKey = true;
            if (closes) inKey = false;
            const w = raw.replace(/\*/g, "");
            const at = Math.round(((times[k] ?? 0) - sceneStart) * fps);
            const p = interpolate(f - at, [0, 7], [0, 1], { ...clamp, easing: ease });
            if (f < at) return <span key={k} style={{ fontFamily: FONT, fontSize: fs, fontWeight: 700, opacity: 0 }}>{w}</span>;
            return (
              <span
                key={k}
                style={{
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: m ? fs * 1.12 : fs,
                  lineHeight: 1.25,
                  color: m ? HI.gold : HI.ivory,
                  opacity: p,
                  display: "inline-block",
                  transform: `translateY(${(1 - p) * 30 * L.u}px) scale(${1.25 - 0.25 * p})`,
                  filter: `blur(${(1 - p) * 10}px)`,
                  textShadow: m ? `0 0 ${30 * L.u}px rgba(181,154,104,0.35)` : "0 4px 24px rgba(0,0,0,0.25)",
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* ───────── props ───────── */
const glass = (u: number): React.CSSProperties => ({
  background: "rgba(247,246,240,0.07)",
  border: `${1.5 * u}px solid rgba(247,246,240,0.16)`,
  borderRadius: 30 * u,
  boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
  backdropFilter: "blur(18px)",
});

const useIn = (delay = 4, d = 14) => {
  const f = useCurrentFrame();
  return interpolate(f - delay, [0, d], [0, 1], { ...clamp, easing: ease });
};

const Rec: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLayout();
  const p = useIn(0, 10);
  const w = 760 * L.u, h = 520 * L.u, c = 70 * L.u, t = 5 * L.u;
  const corner = (r: number) => ({ position: "absolute" as const, width: c, height: c, borderColor: HI.ivory, borderStyle: "solid", borderWidth: 0, opacity: 0.85, ...[{ top: 0, left: 0, borderTopWidth: t, borderLeftWidth: t }, { top: 0, right: 0, borderTopWidth: t, borderRightWidth: t }, { bottom: 0, left: 0, borderBottomWidth: t, borderLeftWidth: t }, { bottom: 0, right: 0, borderBottomWidth: t, borderRightWidth: t }][r] });
  return (
    <div style={{ position: "absolute", left: "50%", top: "36%", width: w, height: h, transform: `translate(-50%,-50%) scale(${1.15 - 0.15 * p})`, opacity: p }}>
      {[0, 1, 2, 3].map((r) => <div key={r} style={corner(r)} />)}
      <div style={{ position: "absolute", top: 26 * L.u, left: 34 * L.u, display: "flex", alignItems: "center", gap: 10 * L.u, fontFamily: LAT, fontWeight: 600, fontSize: 26 * L.u, color: HI.ivory, letterSpacing: 2 * L.u }}>
        <span style={{ width: 16 * L.u, height: 16 * L.u, borderRadius: "50%", background: HI.gold, opacity: Math.floor(f / 12) % 2 ? 1 : 0.25 }} />
        REC
      </div>
      <div style={{ position: "absolute", bottom: 24 * L.u, right: 34 * L.u, fontFamily: LAT, fontSize: 24 * L.u, color: HI.sage }}>{`00:00:${String(Math.floor(f / 30)).padStart(2, "0")}`}</div>
    </div>
  );
};

const LabMini: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLayout();
  const p = useIn(14);
  return (
    <div style={{ ...glass(L.u), position: "absolute", left: "50%", top: "58%", transform: `translate(-50%, ${(1 - p) * 60 * L.u}px)`, opacity: p, width: 560 * L.u, padding: `${22 * L.u}px ${32 * L.u}px`, direction: "rtl" }}>
      {["سكر الصيام", "صورة الدم", "الغدة الدرقية"].map((r, i) => {
        const q = interpolate(f - 20 - i * 6, [0, 10], [0, 1], clamp);
        return (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: `${12 * L.u}px 0`, borderTop: i ? `1px solid rgba(247,246,240,0.12)` : undefined, fontFamily: FONT, fontSize: 32 * L.u, color: HI.ivory }}>
            <span>{r}</span>
            <span style={{ color: HI.gold, opacity: q, transform: `scale(${1.4 - 0.4 * q})` }}>طبيعي ✓</span>
          </div>
        );
      })}
    </div>
  );
};

const Battery: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const L = useLayout();
  const p = useIn(6);
  const lvl = interpolate(f, [10, durationInFrames * 0.8], [0.85, 0.08], { ...clamp, easing: ease });
  const low = lvl < 0.2;
  const W = 420 * L.u, H = 190 * L.u;
  return (
    <div style={{ position: "absolute", left: "50%", top: "54%", transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * p})`, opacity: p, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 * L.u }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: W, height: H, border: `${8 * L.u}px solid ${HI.ivory}`, borderRadius: 34 * L.u, padding: 12 * L.u, display: "flex", justifyContent: "flex-start", direction: "ltr" }}>
          <div style={{ width: `${lvl * 100}%`, height: "100%", borderRadius: 18 * L.u, background: low ? HI.gold : HI.sage, opacity: low ? (Math.floor(f / 8) % 2 ? 1 : 0.35) : 1 }} />
        </div>
        <div style={{ width: 22 * L.u, height: 70 * L.u, background: HI.ivory, borderRadius: `0 ${10 * L.u}px ${10 * L.u}px 0` }} />
      </div>
      <div style={{ fontFamily: LAT, fontWeight: 700, fontSize: 54 * L.u, color: low ? HI.gold : HI.ivory }}>{Math.round(lvl * 100)}%</div>
    </div>
  );
};

const Wrong: React.FC<{ note: string }> = ({ note }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const L = useLayout();
  const p = useIn(4, 12);
  const at = Math.round(durationInFrames * 0.55);
  const x = interpolate(f - at, [0, 8], [0, 1], { ...clamp, easing: ease });
  const shake = f >= at && f < at + 8 ? Math.sin(f * 3) * 10 * L.u : 0;
  return (
    <div style={{ position: "absolute", left: "50%", top: "52%", transform: `translate(calc(-50% + ${shake}px),-50%) rotate(-3deg) scale(${0.85 + 0.15 * p})`, opacity: p }}>
      <div style={{ background: HI.tint, borderRadius: 20 * L.u, padding: `${54 * L.u}px ${64 * L.u}px`, boxShadow: "0 30px 80px rgba(0,0,0,0.35)", border: `${4 * L.u}px solid ${HI.gold}`, direction: "rtl", position: "relative", filter: `grayscale(${x * 0.5})`, opacity: 1 - x * 0.25 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 64 * L.u, color: HI.text, whiteSpace: "nowrap" }}>{note}</div>
        <div style={{ position: "absolute", left: -10 * L.u, right: -10 * L.u, top: "50%", height: 8 * L.u, background: HI.gold, transformOrigin: "right", transform: `scaleX(${x})` }} />
      </div>
      <div style={{ position: "absolute", top: -60 * L.u, left: -60 * L.u, width: 130 * L.u, height: 130 * L.u, borderRadius: "50%", background: HI.text, border: `${6 * L.u}px solid ${HI.gold}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${x ? 0.6 + 0.4 * x : 0}) rotate(${(1 - x) * -40}deg)`, fontFamily: LAT, fontWeight: 700, fontSize: 80 * L.u, color: HI.gold, lineHeight: 1 }}>✕</div>
    </div>
  );
};

const Stars: React.FC<{ labels: string[] }> = ({ labels }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const L = useLayout();
  const pts = [
    [0.18, 0.5], [0.36, 0.58], [0.52, 0.49], [0.68, 0.6], [0.8, 0.47], [0.46, 0.66],
  ].map(([x, y]) => [x * width, y * height]);
  const edges = [[0, 1], [1, 2], [2, 4], [2, 3], [1, 5], [5, 3]];
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      {edges.map(([a, b], i) => {
        const q = interpolate(f - 8 - i * 6, [0, 14], [0, 1], { ...clamp, easing: ease });
        const [x1, y1] = pts[a], [x2, y2] = pts[b];
        return <line key={i} x1={x1} y1={y1} x2={x1 + (x2 - x1) * q} y2={y1 + (y2 - y1) * q} stroke={HI.sage} strokeWidth={3 * L.u} strokeOpacity={0.7} />;
      })}
      {pts.map(([x, y], i) => {
        const q = interpolate(f - 4 - i * 5, [0, 10], [0, 1], { ...clamp, easing: ease });
        const r = (i === 2 ? 22 : 12) * L.u * q * (1 + 0.15 * Math.sin(f / 6 + i));
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={r * 2.4} fill={HI.gold} opacity={0.15 * q} />
            <circle cx={x} cy={y} r={r} fill={i === 2 ? HI.gold : HI.ivory} />
            {labels[i] ? (
              <text x={x} y={y + 64 * L.u} textAnchor="middle" fontFamily={AR} fontWeight={600} fontSize={34 * L.u} fill={HI.ivory} opacity={interpolate(f - 20 - i * 6, [0, 10], [0, 1], clamp)}>{labels[i]}</text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

const Progress: React.FC<{ label: string }> = ({ label }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const L = useLayout();
  const p = useIn(4);
  const v = interpolate(f, [12, durationInFrames * 0.85], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const done = v >= 0.999;
  return (
    <div style={{ position: "absolute", left: "50%", top: "54%", transform: `translate(-50%,-50%) translateY(${(1 - p) * 50 * L.u}px)`, opacity: p, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ ...glass(L.u), width: 640 * L.u, height: 380 * L.u, borderRadius: 26 * L.u, border: `${6 * L.u}px solid ${HI.ivory}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 * L.u }}>
        <svg width={110 * L.u} height={110 * L.u} viewBox="0 0 24 24" fill="none" stroke={done ? HI.gold : HI.ivory} strokeWidth="1.6" strokeLinecap="round">
          <path d="M3 12h3l2-5 3 10 3-7 2 4h5" />
        </svg>
        <div style={{ width: 480 * L.u, height: 22 * L.u, borderRadius: 999, background: "rgba(247,246,240,0.15)", overflow: "hidden", direction: "ltr" }}>
          <div style={{ width: `${v * 100}%`, height: "100%", background: `linear-gradient(90deg, ${HI.sage}, ${HI.gold})` }} />
        </div>
        <div style={{ fontFamily: FONT, fontSize: 32 * L.u, color: HI.ivory, direction: "rtl" }}>
          {done ? "اكتمل التقييم ✓" : label} <span style={{ fontFamily: LAT, color: HI.gold }}>{Math.round(v * 100)}%</span>
        </div>
      </div>
      <div style={{ width: 760 * L.u, height: 26 * L.u, background: HI.ivory, borderRadius: `0 0 ${20 * L.u}px ${20 * L.u}px`, opacity: 0.9 }} />
    </div>
  );
};

const Count: React.FC<{ to: number; unit: string }> = ({ to, unit }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const p = useIn(0, 10);
  const n = Math.round(interpolate(f, [4, 34], [0, to], { ...clamp, easing: ease }));
  const done = n >= to;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: "20%", display: "flex", flexDirection: "column", alignItems: "center", opacity: p }}>
      <div style={{ fontFamily: LAT, fontWeight: 700, fontSize: 300 * L.u, lineHeight: 1, color: HI.gold, textShadow: "0 0 60px rgba(181,154,104,0.3)" }}>{n}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 * L.u, marginTop: 10 * L.u, direction: "rtl" }}>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 46 * L.u, color: HI.ivory }}>{unit}</span>
        <span style={{ width: 60 * L.u, height: 60 * L.u, borderRadius: "50%", border: `${4 * L.u}px solid ${HI.gold}`, display: "flex", alignItems: "center", justifyContent: "center", color: HI.gold, fontSize: 36 * L.u, transform: `scale(${done ? 1 : 0})` }}>✓</span>
      </div>
    </div>
  );
};

const Quote: React.FC<{ chips: string[] }> = ({ chips }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const p = useIn(0, 12);
  return (
    <>
      <div style={{ position: "absolute", top: "20%", left: 0, right: 0, textAlign: "center", fontFamily: LAT, fontWeight: 700, fontSize: 220 * L.u, color: HI.gold, opacity: 0.85 * p, lineHeight: 1 }}>”</div>
      <div style={{ position: "absolute", top: "55%", left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18 * L.u, flexWrap: "wrap", direction: "rtl", padding: `0 ${L.safeX}px` }}>
        {chips.map((c, i) => {
          const q = interpolate(f - 24 - i * 6, [0, 12], [0, 1], { ...clamp, easing: ease });
          return (
            <div key={i} style={{ ...glass(L.u), borderRadius: 999, padding: `${16 * L.u}px ${30 * L.u}px`, display: "flex", alignItems: "center", gap: 12 * L.u, opacity: q, transform: `translateY(${(1 - q) * 30 * L.u}px)` }}>
              <span style={{ width: 14 * L.u, height: 14 * L.u, borderRadius: "50%", background: HI.gold }} />
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 34 * L.u, color: HI.ivory }}>{c}</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Price: React.FC<{ name: string; price: number; old: number }> = ({ name, price, old }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const p = useIn(2, 14);
  const n = Math.round(interpolate(f, [10, 34], [old, price], { ...clamp, easing: ease }));
  const s = interpolate(f - 34, [0, 10], [0, 1], { ...clamp, easing: ease });
  return (
    <div style={{ position: "absolute", left: "50%", top: "53%", transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * p})`, opacity: p }}>
      <div style={{ ...glass(L.u), padding: `${44 * L.u}px ${70 * L.u}px`, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 * L.u, direction: "rtl", position: "relative", overflow: "hidden" }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30 * L.u, color: HI.text, background: HI.gold, borderRadius: 999, padding: `${6 * L.u}px ${24 * L.u}px` }}>خصم</div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 52 * L.u, color: HI.ivory }}>{name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 22 * L.u }}>
          <span style={{ fontFamily: LAT, fontWeight: 700, fontSize: 170 * L.u, color: HI.gold, lineHeight: 1 }}>{n}</span>
          <span style={{ fontFamily: AR, fontWeight: 600, fontSize: 40 * L.u, color: HI.ivory }}>ر.س</span>
          <span style={{ position: "relative", fontFamily: LAT, fontSize: 60 * L.u, color: HI.sage, opacity: s }}>
            {old}
            <span style={{ position: "absolute", left: -4, right: -4, top: "52%", height: 4 * L.u, background: HI.gold, transform: `scaleX(${s})` }} />
          </span>
        </div>
        <LightSweep delay={36} duration={30} strength={0.35} />
      </div>
    </div>
  );
};

const End: React.FC<{ cta: string; disclaimer?: string }> = ({ cta, disclaimer }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const p = useIn(0, 18);
  const q = useIn(12, 16);
  const logo = 420 * L.u;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 44 * L.u, paddingBottom: 120 * L.u }}>
      <div style={{ position: "relative", width: logo, height: logo, borderRadius: "50%", background: HI.white, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transform: `scale(${0.85 + 0.15 * p})`, opacity: p, boxShadow: `0 0 0 ${8 * L.u}px rgba(181,154,104,${0.35 * p}), 0 40px 100px rgba(0,0,0,0.35)` }}>
        <Img src={staticFile("brand/logo.png")} style={{ width: logo * 0.7, height: "auto" }} />
        <LightSweep delay={20} duration={34} strength={0.7} />
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 70 * L.u, color: HI.ivory, opacity: q }}>{CONTACT.nameAr}</div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 46 * L.u, color: HI.text, background: HI.gold, padding: `${18 * L.u}px ${56 * L.u}px`, borderRadius: 999, opacity: q, transform: `translateY(${(1 - q) * 20 * L.u}px) scale(${1 + 0.03 * Math.sin(f / 8)})` }}>{cta}</div>
      <div style={{ fontFamily: LAT, fontWeight: 500, fontSize: 36 * L.u, color: HI.ivory, opacity: q, display: "flex", gap: 24 * L.u }}>
        <span>{CONTACT.phone}</span>
        <span style={{ color: HI.gold }}>•</span>
        <span>{CONTACT.web}</span>
      </div>
      {disclaimer ? <div style={{ position: "absolute", bottom: 360 * L.u, left: L.safeX, right: L.safeX, textAlign: "center", fontFamily: AR, fontSize: 24 * L.u, color: HI.sage, opacity: q, direction: "rtl" }}>{disclaimer}</div> : null}
    </AbsoluteFill>
  );
};

const PropView: React.FC<{ p: PopProp }> = ({ p }) => {
  switch (p.kind) {
    case "rec": return <><Rec /><LabMini /></>;
    case "battery": return <Battery />;
    case "wrong": return <Wrong note={p.note} />;
    case "stars": return <Stars labels={p.labels} />;
    case "progress": return <Progress label={p.label} />;
    case "count": return <Count to={p.to} unit={p.unit} />;
    case "quote": return <Quote chips={p.chips} />;
    case "price": return <Price name={p.name} price={p.price} old={p.old} />;
    case "end": return <End cta={p.cta} disclaimer={p.disclaimer} />;
  }
};

/** vertical position of the kinetic text per prop type */
const textTop = (k: PopProp["kind"]) => (k === "count" ? "46%" : k === "quote" ? "34%" : k === "rec" ? "30%" : k === "progress" ? "17%" : "24%");

/** times (s) at which each display word appears: mapped onto the spoken words of the scene's lines */
const wordTimes = (text: string, lines: PopTimings["lines"]) => {
  const n = text.replace(/\|/g, " ").split(/\s+/).filter(Boolean).length;
  const spoken: Word[] = lines.flatMap((l) => l.words ?? []);
  const s0 = lines[0].start, s1 = lines[lines.length - 1].end;
  return Array.from({ length: n }, (_, k) => {
    if (spoken.length) return spoken[Math.min(spoken.length - 1, Math.floor((k * spoken.length) / n))].start;
    return s0 + ((s1 - s0) * 0.7 * k) / Math.max(1, n);
  });
};

export const PopAd: React.FC<PopProps> = ({ production: p, timings }) => {
  const { durationInFrames } = useVideoConfig();
  if (!timings) return null;
  const starts = p.scenes.map((s, i) => (i === 0 ? 0 : Math.round((timings.lines[s.lines[0]].start - LEAD) * FPS)));
  const endIdx = p.scenes.findIndex((s) => s.prop.kind === "end");
  const musicVol = (fr: number) => {
    const t = fr / FPS;
    const speaking = timings.lines.some((l) => t > l.start - 0.15 && t < l.end + 0.15);
    const base = p.musicVolume ?? 0.24;
    return (speaking ? base * 0.5 : base) * interpolate(fr, [0, 20], [0, 1], clamp) * interpolate(fr, [durationInFrames - 50, durationInFrames], [1, 0], clamp);
  };
  return (
    <AbsoluteFill style={{ background: HI.text }}>
      <DarkBg />
      {p.scenes.map((s, i) => {
        const from = starts[i];
        const to = i < p.scenes.length - 1 ? starts[i + 1] : durationInFrames;
        const lines = s.lines.map((li) => timings.lines[li]);
        const sceneStart = from / FPS;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from} name={`${i}: ${s.prop.kind}`}>
            <Glitch seed={i * 13 + 1}>
              <PropView p={s.prop} />
              {s.text ? (
                <AbsoluteFill style={{ top: textTop(s.prop.kind), bottom: "auto", alignItems: "center", padding: `0 ${80}px` }}>
                  <Kinetic text={s.text} kicker={s.kicker} times={wordTimes(s.text, lines)} sceneStart={sceneStart} />
                </AbsoluteFill>
              ) : null}
            </Glitch>
            {s.sfx ? <Audio src={staticFile(`audio/sfx/${s.sfx}.wav`)} volume={0.55} /> : null}
          </Sequence>
        );
      })}
      <Sequence durationInFrames={endIdx >= 0 ? starts[endIdx] : durationInFrames}>
        <PresenterLayer p={p} timings={timings} starts={starts} />
      </Sequence>
      <Sequence durationInFrames={endIdx >= 0 ? starts[endIdx] : durationInFrames}>
        <CornerLogo />
      </Sequence>
      <Audio src={staticFile(`${p.folder}/voice.wav`)} />
      <Audio src={staticFile(`audio/music/${p.music}.wav`)} volume={musicVol} />
    </AbsoluteFill>
  );
};

export const calcPop: CalculateMetadataFunction<PopProps> = async ({ props }) => {
  const timings: PopTimings = await fetch(staticFile(`${props.production.folder}/timings.json`)).then((r) => r.json());
  return { durationInFrames: Math.ceil((timings.duration + 2.4) * FPS), props: { ...props, timings } };
};

/** Presenter in the bottom-right corner: enters with a rise, blends pose per scene, lip-moves with the voice */
const PresenterLayer: React.FC<{ p: PopProduction; timings: PopTimings; starts: number[] }> = ({ p, timings, starts }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const L = useLayout();
  const i = Math.max(0, starts.findIndex((s, k) => f >= s && (k === starts.length - 1 || f < starts[k + 1])));
  const to = p.scenes[i]?.pose ?? "rest";
  const from = i > 0 ? p.scenes[i - 1]?.pose ?? "rest" : "rest";
  const t = interpolate(f - starts[i], [0, 10], [0, 1], { ...clamp, easing: ease });
  const sec = f / FPS;
  const words = timings.lines.flatMap((l) => l.words ?? [{ w: "", start: l.start, end: l.end }]);
  const inWord = words.some((w) => sec >= w.start && sec <= w.end);
  const talk = inWord ? 0.45 + 0.55 * Math.abs(Math.sin(sec * Math.PI * 5.5)) : 0;
  const enter = interpolate(f, [0, 16], [0, 1], { ...clamp, easing: ease });
  const exit = interpolate(f, [durationInFrames - 8, durationInFrames], [1, 0], clamp);
  const W = Math.round(600 * L.u), H = Math.round(700 * L.u);
  return (
    <div style={{ position: "absolute", right: 20 * L.u, bottom: 70 * L.u, width: W, height: H, transform: `translateY(${(1 - enter) * 260 * L.u}px)`, opacity: Math.min(enter * 1.5, 1) * exit }}>
      <div style={{ position: "absolute", left: "30%", right: "5%", bottom: 0, height: 40 * L.u, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,0.35), transparent 70%)" }} />
      <Presenter3D width={W} height={H} from={from} to={to} t={t} talk={talk} frame={f} />
    </div>
  );
};