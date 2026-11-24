import { loadFont as loadAlexandria } from "@remotion/google-fonts/Alexandria";
import { loadFont as loadPlex } from "@remotion/google-fonts/IBMPlexSansArabic";

// Palette sampled from the reference video
export const C = {
  paper: "#EBEBE6",
  ink: "#141512",
  red: "#E5342D",
  gray: "#8A8D86",
  muted: "#BDBDB6",
} as const;

export type Bg = "paper" | "ink" | "red" | "gray";

export const bgColor = (b: Bg) => ({ paper: C.paper, ink: C.ink, red: C.red, gray: C.gray })[b];
export const fgColor = (b: Bg) => (b === "ink" || b === "red" ? C.paper : C.ink);

export const DISPLAY = loadAlexandria("normal", {
  weights: ["700", "800", "900"],
  subsets: ["arabic", "latin"],
}).fontFamily;

export const BODY = loadPlex("normal", {
  weights: ["400", "600", "700"],
  subsets: ["arabic", "latin"],
}).fontFamily;

export const pad2 = (n: number) => String(n).padStart(2, "0");
