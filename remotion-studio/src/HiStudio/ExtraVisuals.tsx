import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AR, EASE, FONT, HI, LAT, useLayout } from "./brand";
import { clamp, Glass, Headline, LightSweep, SoftBackground } from "./Primitives";
import type { Visual } from "./types";

const ease = Easing.bezier(...EASE);

const Check: React.FC<{ size: number; p: number; color?: string }> = ({ size, p, color = HI.green }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10.5" stroke={color} strokeOpacity={0.35} strokeWidth="1.5" />
    <path d="M7 12.5l3.2 3.2L17 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
  </svg>
);

/** Lab-report hook: every row ticks "طبيعي" … then the twist line appears */
export const Labs: React.FC<{ v: Extract<Visual, { kind: "labs" }> }> = ({ v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const card = interpolate(f, [0, 22], [0, 1], { ...clamp, easing: ease });
  const twistAt = Math.round((v.twistAt ?? 2.2) * fps);
  // card recedes slightly when the twist arrives (focus shifts to the question)
  const recede = interpolate(f - twistAt, [0, 20], [0, 1], { ...clamp, easing: ease });
  const w = Math.min(L.width - L.safeX * 2, 820 * L.u);
  return (
    <AbsoluteFill>
      <SoftBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 54 * L.u, padding: `${L.safeTop}px ${L.safeX}px ${L.safeBottom}px` }}>
        <Headline text={v.heading} size={L.h1 * 0.95} />
        <Glass
          style={{
            width: w,
            padding: `${34 * L.u}px ${40 * L.u}px`,
            direction: "rtl",
            opacity: card * (1 - recede * 0.12),
            transform: `translateY(${(1 - card) * 70 * L.u}px) scale(${1 - recede * 0.04})`,
            
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 * L.u }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: L.body, color: HI.text }}>{v.title ?? "نتائج التحاليل"}</div>
            <div style={{ fontFamily: LAT, fontWeight: 600, fontSize: L.body * 0.6, letterSpacing: 3 * L.u, color: HI.gold }}>LAB REPORT</div>
          </div>
          {v.rows.map((r, i) => {
            const p = interpolate(f - 12 - i * 7, [0, 18], [0, 1], { ...clamp, easing: ease });
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${18 * L.u}px 0`, borderTop: `${1 * L.u}px solid ${HI.sage}33`, opacity: p, transform: `translateX(${(1 - p) * 40 * L.u}px)` }}>
                <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: L.body * 0.85, color: HI.text }}>{r}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 * L.u }}>
                  <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: L.body * 0.72, color: HI.green, background: HI.tint, padding: `${6 * L.u}px ${18 * L.u}px`, borderRadius: 999 }}>طبيعي</span>
                  <Check size={40 * L.u} p={interpolate(f - 18 - i * 7, [0, 14], [0, 1], clamp)} />
                </div>
              </div>
            );
          })}
          <LightSweep delay={10 + v.rows.length * 7} duration={30} strength={0.5} />
        </Glass>
        {v.twist ? (
          <div style={{ minHeight: L.h2 * 1.4 }}>
            {f >= twistAt ? <Headline text={v.twist} size={L.h2 * 1.05} color={HI.muted} /> : null}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Bio-signal waves: a noisy gold signal settles into a smooth reading while a scan line passes */
export const Wave: React.FC<{ v: Extract<Visual, { kind: "wave" }> }> = ({ v }) => {
  const f = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const t = f / Math.max(1, durationInFrames);
  const settle = interpolate(f, [10, durationInFrames * 0.7], [1, 0.15], { ...clamp, easing: ease });
  const cy = height * (L.portrait ? 0.5 : 0.55);
  const amp = (L.portrait ? 120 : 110) * L.u;
  const path = (k: number, phase: number, noise: number, a: number) => {
    let d = "";
    for (let i = 0; i <= 120; i++) {
      const x = (i / 120) * width;
      const n = Math.sin(i * 1.7 + f * 0.31) * Math.sin(i * 0.53 + k) * noise;
      const y = cy + Math.sin((i / 120) * Math.PI * 2 * (1.4 + k * 0.35) + phase + f / 22) * a + n * a * 0.9;
      d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
    }
    return d;
  };
  const scanX = interpolate(f, [0, durationInFrames], [width * 1.05, -width * 0.05]);
  const chip = interpolate(f - 16, [0, 22], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill>
      <SoftBackground tone="tint" />
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="scan" x1="0" x2="1">
            <stop offset="0" stopColor={HI.gold} stopOpacity="0" />
            <stop offset="0.5" stopColor={HI.gold} stopOpacity="0.55" />
            <stop offset="1" stopColor={HI.gold} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* grid */}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={0} x2={width} y1={cy + (i - 4) * amp * 0.5} y2={cy + (i - 4) * amp * 0.5} stroke={HI.sage} strokeOpacity={0.14} strokeWidth={1.2 * L.u} />
        ))}
        <path d={path(2, 1.8, 0, amp * 0.55)} stroke={HI.sage} strokeOpacity={0.45} strokeWidth={3 * L.u} fill="none" />
        <path d={path(1, 0.9, 0, amp * 0.75)} stroke={HI.green} strokeOpacity={0.55} strokeWidth={3.5 * L.u} fill="none" />
        <path d={path(0, 0, settle, amp)} stroke={HI.gold} strokeWidth={5 * L.u} fill="none" strokeLinecap="round" />
        <rect x={scanX - 60 * L.u} y={0} width={120 * L.u} height={height} fill="url(#scan)" />
      </svg>
      {v.label ? (
        <div style={{ position: "absolute", top: cy + amp * 1.9, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: chip, transform: `translateY(${(1 - chip) * 30 * L.u}px)` }}>
          <Glass style={{ padding: `${16 * L.u}px ${34 * L.u}px`, direction: "rtl", display: "flex", alignItems: "center", gap: 16 * L.u }}>
            <span style={{ width: 16 * L.u, height: 16 * L.u, borderRadius: "50%", background: HI.gold, opacity: 0.6 + 0.4 * Math.sin(t * 40) }} />
            <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: L.body * 0.85, color: HI.text }}>{v.label}</span>
          </Glass>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Offer card: package name, price counting down from the old price, struck-through old price, benefits */
export const Offer: React.FC<{ v: Extract<Visual, { kind: "offer" }> }> = ({ v }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const p = interpolate(f, [0, 24], [0, 1], { ...clamp, easing: ease });
  const count = interpolate(f, [14, 44], [v.oldPrice, v.price], { ...clamp, easing: ease });
  const strike = interpolate(f - 44, [0, 14], [0, 1], { ...clamp, easing: ease });
  const w = Math.min(L.width - L.safeX * 2, 800 * L.u);
  return (
    <AbsoluteFill>
      <SoftBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: `${L.safeTop}px ${L.safeX}px ${L.safeBottom}px` }}>
        <Glass style={{ width: w, padding: `${46 * L.u}px ${50 * L.u}px`, direction: "rtl", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 * L.u, opacity: p, transform: `translateY(${(1 - p) * 80 * L.u}px) scale(${0.95 + 0.05 * p})`, position: "relative", overflow: "hidden" }}>
          {v.badge ? <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: L.body * 0.7, color: HI.white, background: HI.gold, padding: `${8 * L.u}px ${26 * L.u}px`, borderRadius: 999 }}>{v.badge}</div> : null}
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: L.h2, color: HI.green }}>{v.name}</div>
          {v.nameEn ? <div style={{ fontFamily: LAT, fontWeight: 600, fontSize: L.body * 0.6, letterSpacing: 5 * L.u, color: HI.gold, marginTop: -10 * L.u }}>{v.nameEn}</div> : null}
          <div style={{ display: "flex", alignItems: "baseline", gap: 26 * L.u, direction: "rtl", margin: `${10 * L.u}px 0` }}>
            <span style={{ fontFamily: LAT, fontWeight: 700, fontSize: L.h1 * 1.7, color: HI.text, lineHeight: 1 }}>{Math.round(count)}</span>
            <span style={{ fontFamily: AR, fontWeight: 600, fontSize: L.body, color: HI.text }}>{v.currency ?? "ر.س"}</span>
            <span style={{ position: "relative", fontFamily: LAT, fontWeight: 500, fontSize: L.h2 * 0.9, color: HI.muted, opacity: strike }}>
              {v.oldPrice}
              <span style={{ position: "absolute", left: -4 * L.u, right: -4 * L.u, top: "52%", height: 3 * L.u, background: HI.gold, transformOrigin: "right", transform: `scaleX(${strike})` }} />
            </span>
          </div>
          <div style={{ width: "70%", height: 1.5 * L.u, background: `${HI.gold}66` }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 * L.u, alignSelf: "stretch" }}>
            {v.items.map((it, i) => {
              const q = interpolate(f - 30 - i * 8, [0, 20], [0, 1], { ...clamp, easing: ease });
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 18 * L.u, opacity: q, transform: `translateX(${(1 - q) * 40 * L.u}px)` }}>
                  <Check size={38 * L.u} p={q} color={HI.gold} />
                  <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: L.body * 0.85, color: HI.text }}>{it}</span>
                </div>
              );
            })}
          </div>
          <LightSweep delay={46} duration={34} strength={0.55} />
        </Glass>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
