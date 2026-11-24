import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction } from "remotion";
import { EASE, useLayout } from "./brand";
import { Callouts, Captions, clamp, CornerLogo, Headline, LightSweep } from "./Primitives";
import type { Production, Scene, Timings } from "./types";
import { isDark, VisualView } from "./Visuals";

export const FPS = 30;
const T = 14; // transition frames
const LEAD = 0.25; // scene starts this many seconds before its VO line (picture leads sound)
const ease = Easing.bezier(...EASE);

export type HiAdProps = { production: Production; timings?: Timings; tracks?: Record<string, { x: number; y: number }[]> };

/** Scene windows (frames) derived from VO timings */
const windows = (p: Production, t: Timings, total: number) =>
  p.scenes.map((s, i) => {
    const first = t.lines[s.lines[0]];
    const start = i === 0 ? 0 : Math.max(0, Math.round((first.start - LEAD) * FPS));
    const nextScene = p.scenes[i + 1];
    const end = nextScene ? Math.round((t.lines[nextScene.lines[0]].start - LEAD) * FPS) : total;
    return { start, end };
  });

/** Transition-in wrapper: blur dissolve, zoom-through (match-cut feel), light-sweep reveal, or hard cut */
const TransitionIn: React.FC<{ kind: Scene["transition"]; children: React.ReactNode }> = ({ kind = "blur", children }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, T], [0, 1], { ...clamp, easing: ease });
  if (kind === "cut" || p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  if (kind === "zoom")
    return <AbsoluteFill style={{ opacity: p, transform: `scale(${1.18 - 0.18 * p})`, filter: `blur(${(1 - p) * 18}px)` }}>{children}</AbsoluteFill>;
  if (kind === "sweep")
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${(1 - p) * 100}%)` }}>{children}</AbsoluteFill>
        <LightSweep duration={T + 6} strength={0.9} />
      </AbsoluteFill>
    );
  return <AbsoluteFill style={{ opacity: p, filter: `blur(${(1 - p) * 12}px)` }}>{children}</AbsoluteFill>;
};

const Overlay: React.FC<{ text: string; dark: boolean }> = ({ text, dark }) => {
  const L = useLayout();
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: L.safeTop + 40 * L.u }}>
      <div style={{ padding: `${18 * L.u}px ${36 * L.u}px`, borderRadius: 28 * L.u, background: dark ? "rgba(41,50,45,0.35)" : "rgba(247,246,240,0.6)", backdropFilter: "blur(14px)" }}>
        <Headline text={text} size={L.h2 * 1.1} color={dark ? "#FFFFFF" : undefined} delay={6} />
      </div>
    </AbsoluteFill>
  );
};

export const HiAd: React.FC<HiAdProps> = ({ production: p, timings, tracks }) => {
  const { durationInFrames } = useVideoConfig();
  if (!timings) return null;
  const w = windows(p, timings, durationInFrames);
  const endScene = p.scenes.findIndex((s) => s.visual.kind === "end");
  const logoUntil = endScene >= 0 ? w[endScene].start + T : durationInFrames;
  // Music ducks under the voice, swells in gaps
  const musicVol = (fr: number) => {
    const t = fr / FPS;
    const speaking = timings.lines.some((l) => t > l.start - 0.2 && t < l.end + 0.2);
    const base = p.musicVolume ?? 0.22;
    const fadeIn = interpolate(fr, [0, 45], [0, 1], clamp);
    const fadeOut = interpolate(fr, [durationInFrames - 60, durationInFrames], [1, 0], clamp);
    return (speaking ? base * 0.45 : base) * fadeIn * fadeOut;
  };
  return (
    <AbsoluteFill style={{ background: "#F7F6F0" }}>
      {p.scenes.map((s, i) => {
        const dur = w[i].end - w[i].start + (i < p.scenes.length - 1 ? T : 0);
        const dark = isDark(s.visual);
        return (
          <Sequence key={i} from={w[i].start} durationInFrames={dur} name={`${i}: ${s.visual.kind}`}>
            <TransitionIn kind={i === 0 ? "cut" : s.transition}>
              <VisualView v={s.visual} />
              {s.overlay ? <Overlay text={s.overlay} dark={dark || s.visual.kind === "blood3d"} /> : null}
              {s.callouts ? <Callouts items={s.callouts} dark={dark} trackData={tracks} /> : null}
              {s.lightSweep ? <LightSweep delay={Math.round(dur * 0.35)} duration={40} /> : null}
            </TransitionIn>
            {s.sfx ? <Audio src={staticFile(`audio/sfx/${s.sfx}.wav`)} volume={0.5} /> : null}
          </Sequence>
        );
      })}

      {/* Persistent brand mark (every frame until the end card takes over) */}
      <Sequence durationInFrames={logoUntil}>
        <CornerLogo />
      </Sequence>

      {p.captions !== false ? (
        <Sequence durationInFrames={endScene >= 0 ? w[endScene].start : durationInFrames}>
          <CaptionsLayer timings={timings} p={p} w={w} />
        </Sequence>
      ) : null}

      <Audio src={staticFile(`${p.folder}/voice.wav`)} />
      <Audio src={staticFile(`audio/music/${p.music}.wav`)} volume={musicVol} />
    </AbsoluteFill>
  );
};

/** Caption colour follows the scene underneath (light text on footage) */
const CaptionsLayer: React.FC<{ timings: Timings; p: Production; w: { start: number; end: number }[] }> = ({ timings, p, w }) => {
  const f = useCurrentFrame();
  const i = Math.max(0, w.findIndex((x) => f >= x.start && f < x.end));
  const v = p.scenes[i]?.visual;
  return <Captions timings={timings} dark={v ? isDark(v) || v.kind === "blood3d" : false} />;
};

/** Duration = VO length + end-card hold; loads timings.json (and tracking files) from public/ */
export const calcHiAd: CalculateMetadataFunction<HiAdProps> = async ({ props }) => {
  const timings: Timings = await fetch(staticFile(`${props.production.folder}/timings.json`)).then((r) => r.json());
  const trackFiles = Array.from(new Set(props.production.scenes.flatMap((s) => s.callouts ?? []).map((c) => c.track).filter(Boolean))) as string[];
  const tracks: Record<string, { x: number; y: number }[]> = {};
  for (const t of trackFiles) tracks[t] = await fetch(staticFile(t)).then((r) => r.json());
  const hold = 2.2; // seconds the end card stays after the last word
  return { durationInFrames: Math.ceil((timings.duration + hold) * FPS), props: { ...props, timings, tracks } };
};
