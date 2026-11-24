import { loadFont as loadNoto } from "@remotion/google-fonts/NotoSansArabic";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { useVideoConfig } from "remotion";

/**
 * Hidden Impact brand tokens — mirrored from the design system
 * (hidden-impact-design-system/hidden-impact/brand-library/02_BRAND_COLOR_TOKENS.json).
 * Do not invent colors outside this file.
 */
export const HI = {
  green: "#405B4B", // Deep Botanical Green — headlines, key elements
  sage: "#829786", // Soft Sage — secondary
  tint: "#E9EFE9", // Pale Sage — section backgrounds
  ivory: "#F7F6F0", // Warm Ivory — base background
  gold: "#B59A68", // Muted Champagne Gold — fine accents, numbers, CTA details
  text: "#29322D", // Charcoal
  muted: "#858B86", // Soft Gray
  white: "#FFFFFF",
  // Approved-pending status red, used only for physiologically accurate red blood cells
  rbc: "#B5524A",
} as const;

export const CONTACT = {
  phone: "0553565015",
  web: "hiddenimpactsa.com",
  nameAr: "مركز الأثر الخفي",
  nameEn: "HIDDEN IMPACT",
};

export const AR = loadNoto("normal", { weights: ["400", "500", "600", "700"], subsets: ["arabic"] }).fontFamily;
export const LAT = loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily;
export const FONT = `${LAT}, ${AR}, sans-serif`;

/** Apple-like ease: fast start, long soft landing */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Responsive layout helpers for 9:16, 16:9 and 1:1 from the same components */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const portrait = height > width * 1.2;
  const landscape = width > height * 1.2;
  const u = Math.min(width, height) / 1080; // 1 unit = 1px at 1080 short side
  return {
    width,
    height,
    portrait,
    landscape,
    square: !portrait && !landscape,
    u,
    // Platform-UI safe areas (Reels/TikTok cover top + bottom on vertical)
    safeTop: portrait ? 230 * u : 70 * u,
    safeBottom: portrait ? 330 * u : 90 * u,
    safeX: portrait ? 80 * u : 120 * u,
    h1: (portrait ? 92 : landscape ? 84 : 80) * u,
    h2: (portrait ? 56 : 50) * u,
    body: (portrait ? 40 : 36) * u,
  };
};
