/** A Hidden Impact production = voice-over timings + one visual scene per VO line (or group of lines). */

export type Transition = "blur" | "zoom" | "sweep" | "cut";
export type Sfx = "whoosh" | "whoosh-soft" | "riser" | "hit" | "shimmer" | "pop" | "tick" | "pulse" | "sweep";

export type Callout = {
  /** 0..1 position of the point inside the frame */
  x: number;
  y: number;
  label: string;
  /** which side the label sits on */
  side?: "left" | "right";
  /** seconds after scene start */
  at?: number;
  /** optional motion-tracking JSON (public/...) from scripts/track.ps1 — overrides x/y per frame */
  track?: string;
};

export type Visual =
  /** Big Apple-style headline over a soft brand background. Wrap the key word in *stars*. */
  | { kind: "title"; text: string; sub?: string }
  /** Real footage (public/...): cinematic push-in, brand grade, optional depth-of-field */
  | { kind: "footage"; src: string; startFrom?: number; zoom?: number; dof?: boolean; rate?: number }
  /** Still image with 2.5D parallax. fg = optional cut-out subject (scripts/remove-bg.ps1) */
  | { kind: "parallax"; bg: string; fg?: string; zoom?: number }
  /** Procedural 3D medical scenes */
  | { kind: "cells3d" }
  | { kind: "blood3d" }
  | { kind: "dna3d" }
  /** Glass info cards (icons: energy | sleep | focus | scan | nutrition | lifestyle | doctor | heart) */
  | { kind: "cards"; items: { icon: Icon; label: string }[]; heading?: string }
  /** Numbered solution steps */
  | { kind: "steps"; heading?: string; items: string[] }
  /** Lab-report hook: rows tick "طبيعي", then the twist line (seconds) */
  | { kind: "labs"; heading: string; rows: string[]; title?: string; twist?: string; twistAt?: number }
  /** Bio-signal waves settling into a clean reading + optional glass label */
  | { kind: "wave"; label?: string }
  /** Offer / package price card (confirmed prices only) */
  | { kind: "offer"; name: string; nameEn?: string; price: number; oldPrice: number; currency?: string; badge?: string; items: string[] }
  /** Closing scene: logo + CTA + contact + disclaimer */
  | { kind: "end"; cta: string; disclaimer?: string };

export type Icon = "energy" | "sleep" | "focus" | "scan" | "nutrition" | "lifestyle" | "doctor" | "heart";

export type Scene = {
  /** VO line indexes this scene covers (from timings.json) */
  lines: number[];
  visual: Visual;
  transition?: Transition;
  sfx?: Sfx;
  /** short on-screen headline (≤ 6 words) layered over 3D/footage scenes */
  overlay?: string;
  callouts?: Callout[];
  /** light sweep across the frame during this scene */
  lightSweep?: boolean;
};

export type Timings = {
  duration: number;
  lines: { i: number; text: string; start: number; end: number }[];
};

export type Production = {
  id: string;
  /** folder in public/ holding voice.wav + timings.json */
  folder: string;
  music: "ambient-calm" | "ambient-hopeful" | "ambient-deep" | string;
  musicVolume?: number;
  captions?: boolean;
  scenes: Scene[];
};
