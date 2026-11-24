import type { Bg } from "./theme";

type Base = {
  /** seconds */
  duration: number;
  bg?: Bg;
  /** Caption at the top. Wrap a word in *stars* to highlight it in a red box. */
  caption?: string;
  /** 1-based chapter index: drives the progress dashes + top label */
  chapter?: number;
};

export type Scene =
  | (Base & { type: "hook"; word: string; boxes?: number })
  | (Base & { type: "chapter"; number: string; kicker: string; title: string })
  | (Base & { type: "word"; word: string })
  | (Base & { type: "stretch"; word: string; stretchAfter: number })
  | (Base & { type: "counter"; to: number; label: string })
  | (Base & { type: "icon"; from: "card" | "heart" | "star"; to: "card" | "heart" | "star"; fromLabel?: string; toLabel?: string })
  | (Base & { type: "end"; name: string; handle: string; pills: string[] });

export type VideoScript = {
  /** Chapter names shown top-right, e.g. ["الوقفة", "القص"] */
  chapters: string[];
  /** Small vertical handle on the side, e.g. "@yourname" (empty = hidden) */
  handle: string;
  /** Optional files inside remotion-studio/public, e.g. "voice.mp3" */
  voiceover?: string;
  music?: string;
  musicVolume?: number;
  scenes: Scene[];
};
