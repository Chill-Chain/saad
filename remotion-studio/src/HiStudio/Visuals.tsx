import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AR, CONTACT, EASE, FONT, HI, useLayout } from "./brand";
import { Blood3D, Cells3D, Dna3D } from "./Medical3D";
import { clamp, Glass, Headline, IconSvg, LightSweep, SoftBackground } from "./Primitives";
import type { Visual } from "./types";
import { Labs, Offer, Wave } from "./ExtraVisuals";

const ease = Easing.bezier(...EASE);

/** Slow cinematic push-in shared by footage and stills */
const usePush = (zoom = 0.08) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return 1 + zoom * interpolate(f, [0, durationInFrames], [0, 1], clamp);
};

/** Brand grade over real footage: warm-neutral, lifted blacks, soft vignette */
const Grade: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(247,246,240,0.10), rgba(64,91,75,0.10))", mixBlendMode: "soft-light" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(41,50,45,0.35) 100%)" }} />
  </>
);

const Footage: React.FC<{ v: Extract<Visual, { kind: "footage" }> }> = ({ v }) => {
  const s = usePush(v.zoom ?? 0.1);
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: HI.text }}>
      <AbsoluteFill style={{ transform: `scale(${s})`, filter: v.dof ? "blur(0px)" : undefined }}>
        <OffthreadVideo src={staticFile(v.src)} muted startFrom={Math.round((v.startFrom ?? 0) * fps)} playbackRate={v.rate ?? 1} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      {v.dof ? <AbsoluteFill style={{ backdropFilter: "blur(6px)", maskImage: "radial-gradient(ellipse at center, transparent 45%, black 85%)" }} /> : null}
      <Grade />
    </AbsoluteFill>
  );
};

/** 2.5D parallax: background drifts + blurs (depth of field), cut-out subject moves faster and stays sharp */
const Parallax: React.FC<{ v: Extract<Visual, { kind: "parallax" }> }> = ({ v }) => {
  const f = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const t = interpolate(f, [0, durationInFrames], [0, 1], clamp);
  const z = v.zoom ?? 0.1;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={staticFile(v.bg)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.08 + z * t}) translateX(${-t * width * 0.015}px)`, filter: v.fg ? `blur(${2 + t * 3}px)` : undefined }} />
      {v.fg ? <Img src={staticFile(v.fg)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.02 + z * 1.8 * t}) translateX(${t * width * 0.02}px)` }} /> : null}
      <Grade />
    </AbsoluteFill>
  );
};

const Cards: React.FC<{ v: Extract<Visual, { kind: "cards" }> }> = ({ v }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const size = L.portrait ? 280 * L.u : 300 * L.u;
  return (
    <AbsoluteFill>
      <SoftBackground tone="tint" />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 60 * L.u, padding: `${L.safeTop}px ${L.safeX}px ${L.safeBottom}px` }}>
        {v.heading ? <Headline text={v.heading} size={L.h2} /> : null}
        <div style={{ display: "flex", gap: 34 * L.u, direction: "rtl", flexWrap: "wrap", justifyContent: "center" }}>
          {v.items.map((it, i) => {
            const p = interpolate(f - 10 - i * 7, [0, 24], [0, 1], { ...clamp, easing: ease });
            return (
              <Glass key={i} style={{ width: size, height: size * 1.05, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 * L.u, opacity: p, transform: `translateY(${(1 - p) * 60 * L.u}px) scale(${0.94 + p * 0.06})` }}>
                <div style={{ width: 120 * L.u, height: 120 * L.u, borderRadius: "50%", background: "rgba(233,239,233,0.9)", border: `${1.5 * L.u}px solid ${HI.gold}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconSvg name={it.icon} size={70 * L.u} />
                </div>
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: L.body, color: HI.text }}>{it.label}</div>
              </Glass>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Steps: React.FC<{ v: Extract<Visual, { kind: "steps" }> }> = ({ v }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  return (
    <AbsoluteFill>
      <SoftBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 44 * L.u, padding: `${L.safeTop}px ${L.safeX}px ${L.safeBottom}px` }}>
        {v.heading ? <Headline text={v.heading} size={L.h2} /> : null}
        <div style={{ display: "flex", flexDirection: L.landscape ? "row-reverse" : "column", gap: 24 * L.u, width: L.landscape ? undefined : "100%" }}>
          {v.items.map((s, i) => {
            const p = interpolate(f - 12 - i * 10, [0, 24], [0, 1], { ...clamp, easing: ease });
            return (
              <Glass key={i} style={{ display: "flex", alignItems: "center", gap: 28 * L.u, padding: `${28 * L.u}px ${36 * L.u}px`, direction: "rtl", opacity: p, transform: `translateX(${(1 - p) * 80 * L.u}px)` }}>
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: L.h2, color: HI.gold, minWidth: 70 * L.u, textAlign: "center" }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={{ width: 1.5 * L.u, alignSelf: "stretch", background: `${HI.gold}66` }} />
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: L.body * 1.05, color: HI.text }}>{s}</div>
              </Glass>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Closing scene: the official logo large on white, light sweep, CTA, contact, disclaimer */
const End: React.FC<{ v: Extract<Visual, { kind: "end" }> }> = ({ v }) => {
  const f = useCurrentFrame();
  const L = useLayout();
  const p = interpolate(f, [0, 30], [0, 1], { ...clamp, easing: ease });
  const q = interpolate(f - 18, [0, 24], [0, 1], { ...clamp, easing: ease });
  const logo = (L.portrait ? 430 : 330) * L.u;
  return (
    <AbsoluteFill>
      <SoftBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: L.landscape ? "row-reverse" : "column", gap: 56 * L.u, padding: `${L.safeTop}px ${L.safeX}px ${L.safeBottom}px` }}>
        <div style={{ position: "relative", width: logo * 1.2, height: logo * 1.2, borderRadius: "50%", background: HI.white, boxShadow: `0 ${30 * L.u}px ${80 * L.u}px rgba(41,50,45,0.12)`, display: "flex", alignItems: "center", justifyContent: "center", opacity: p, transform: `scale(${0.9 + 0.1 * p})`, overflow: "hidden" }}>
          <Img src={staticFile("brand/logo.png")} style={{ width: logo * 0.82, height: "auto" }} />
          <LightSweep delay={24} duration={36} strength={0.7} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 * L.u, direction: "rtl" }}>
          <div style={{ fontFamily: AR, fontWeight: 700, fontSize: L.h2 * 1.05, color: HI.green, opacity: q }}>{CONTACT.nameAr}</div>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: L.body * 1.1, color: HI.white, background: HI.green, padding: `${18 * L.u}px ${48 * L.u}px`, borderRadius: 999, opacity: q, transform: `translateY(${(1 - q) * 20 * L.u}px)`, boxShadow: `inset 0 0 0 ${1.5 * L.u}px ${HI.gold}` }}>{v.cta}</div>
          <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: L.body * 0.9, color: HI.text, opacity: q, direction: "ltr", display: "flex", gap: 26 * L.u }}>
            <span>{CONTACT.phone}</span>
            <span style={{ color: HI.gold }}>•</span>
            <span>{CONTACT.web}</span>
          </div>
        </div>
      </AbsoluteFill>
      {v.disclaimer ? (
        <div style={{ position: "absolute", bottom: L.portrait ? 150 * L.u : 40 * L.u, left: L.safeX, right: L.safeX, textAlign: "center", fontFamily: AR, fontSize: L.body * 0.6, color: HI.muted, direction: "rtl", opacity: q }}>{v.disclaimer}</div>
      ) : null}
    </AbsoluteFill>
  );
};

const Title: React.FC<{ v: Extract<Visual, { kind: "title" }> }> = ({ v }) => {
  const L = useLayout();
  return (
    <AbsoluteFill>
      <SoftBackground />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 30 * L.u, padding: `0 ${L.safeX}px` }}>
        <Headline text={v.text} />
        {v.sub ? <Headline text={v.sub} size={L.h2 * 0.75} color={HI.muted} delay={14} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const VisualView: React.FC<{ v: Visual }> = ({ v }) => {
  switch (v.kind) {
    case "title": return <Title v={v} />;
    case "footage": return <Footage v={v} />;
    case "parallax": return <Parallax v={v} />;
    case "cells3d": return <Cells3D />;
    case "blood3d": return <Blood3D />;
    case "dna3d": return <Dna3D />;
    case "cards": return <Cards v={v} />;
    case "steps": return <Steps v={v} />;
    case "end": return <End v={v} />;
    case "labs": return <Labs v={v} />;
    case "wave": return <Wave v={v} />;
    case "offer": return <Offer v={v} />;
  }
};

export const isDark = (v: Visual) => v.kind === "footage" || v.kind === "parallax";
