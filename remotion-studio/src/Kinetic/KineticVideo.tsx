import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, type CalculateMetadataFunction } from "remotion";
import { BrandLogo } from "../Brand";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { Caption, Chrome } from "./Chrome";
import { redWipe } from "./RedWipe";
import { Chapter, Counter, End, Hook, IconMorph, Stretch, WordCut } from "./Scenes";
import { bgColor, type Bg } from "./theme";
import type { Scene, VideoScript } from "./types";

export const FPS = 30;
export const TRANSITION = 8; // frames

const Grain: React.FC<{ bg: Bg }> = ({ bg }) => (
  <AbsoluteFill style={{ opacity: bg === "paper" ? 0.09 : 0.05, mixBlendMode: "multiply", pointerEvents: "none" }}>
    <svg width="100%" height="100%">
      <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#g)" />
    </svg>
  </AbsoluteFill>
);

const SceneView: React.FC<{ s: Scene; script: VideoScript }> = ({ s, script }) => {
  const bg: Bg = s.bg ?? "paper";
  const body = (() => {
    switch (s.type) {
      case "hook": return <Hook s={s} bg={bg} />;
      case "chapter": return <Chapter s={s} bg={bg} />;
      case "word": return <WordCut s={s} bg={bg} />;
      case "stretch": return <Stretch s={s} bg={bg} />;
      case "counter": return <Counter s={s} bg={bg} />;
      case "icon": return <IconMorph s={s} bg={bg} />;
      case "end": return <End s={s} bg={bg} />;
    }
  })();
  return (
    <AbsoluteFill style={{ background: bgColor(bg) }}>
      <Grain bg={bg} />
      {s.type !== "end" ? <Chrome bg={bg} chapter={s.chapter} chapters={script.chapters} handle={script.handle} /> : null}
      {body}
      {s.caption ? <Caption text={s.caption} bg={bg} /> : null}
    </AbsoluteFill>
  );
};

export const KineticVideo: React.FC<{ script: VideoScript }> = ({ script }) => {
  // Frame where the final "end" scene becomes fully visible (logo moves into it there)
  const frames = script.scenes.map((s) => Math.round(s.duration * FPS));
  const last = script.scenes.length - 1;
  const endStart =
    script.scenes[last]?.type === "end"
      ? frames.slice(0, last).reduce((a, f) => a + f - TRANSITION, 0) + TRANSITION
      : Infinity;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <TransitionSeries>
        {script.scenes.flatMap((s, i) => {
          const items = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={Math.round(s.duration * FPS)}>
              <SceneView s={s} script={script} />
            </TransitionSeries.Sequence>,
          ];
          if (i < script.scenes.length - 1) {
            items.push(<TransitionSeries.Transition key={`t${i}`} presentation={redWipe()} timing={linearTiming({ durationInFrames: TRANSITION })} />);
          }
          return items;
        })}
      </TransitionSeries>
      {/* Brand logo on every frame (the end card shows it large instead) */}
      <Sequence durationInFrames={endStart}>
        <BrandLogo position="top-center" size={120} />
      </Sequence>
      {script.voiceover ? <Audio src={staticFile(script.voiceover)} /> : null}
      {script.music ? <Audio src={staticFile(script.music)} volume={script.musicVolume ?? 0.15} loop /> : null}
    </AbsoluteFill>
  );
};

export const calcKinetic: CalculateMetadataFunction<{ script: VideoScript }> = ({ props }) => {
  const total = props.script.scenes.reduce((a, s) => a + Math.round(s.duration * FPS), 0);
  return { durationInFrames: Math.max(1, total - TRANSITION * (props.script.scenes.length - 1)) };
};
