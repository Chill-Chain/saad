import type { Production } from "../types";

/*
  نموذج: إعلان "التعب المستمر" — مركز الأثر الخفي
  الصوت: projects/fatigue-ad/vo.txt → scripts/voiceover.ps1 → public/projects/fatigue-ad/{voice.wav,timings.json}
  كل مشهد مربوط بسطر (أو أسطر) من التعليق الصوتي عبر lines.

  ⚠️ مشاهد الأشخاص الواقعية: ضع لقطات (stock/AI/تصوير) في public/projects/fatigue-ad/ وبدّل
     المشهدين 0 و 1 إلى { kind: "footage", src: "projects/fatigue-ad/morning.mp4" }.
*/
export const fatigue: Production = {
  id: "fatigue-ad",
  folder: "projects/fatigue-ad",
  music: "ambient-calm",
  musicVolume: 0.2,
  captions: true,
  scenes: [
    // Hook
    { lines: [0], visual: { kind: "title", text: "تصحى *تعبان*؟", sub: "حتى بعد ٨ ساعات نوم" }, sfx: "riser" },
    // Problem
    {
      lines: [1],
      visual: { kind: "cards", heading: "عادي... ضغط شغل؟", items: [{ icon: "energy", label: "طاقة أقل" }, { icon: "sleep", label: "نوم متقطع" }, { icon: "focus", label: "تركيز مشتت" }] },
      transition: "zoom",
      sfx: "whoosh-soft",
    },
    // Explanation (inside the body)
    {
      lines: [2],
      visual: { kind: "cells3d" },
      transition: "zoom",
      sfx: "whoosh",
      overlay: "داخل *جسمك*",
      callouts: [
        { x: 0.62, y: 0.46, label: "خلايا", at: 2.2 },
        { x: 0.36, y: 0.62, label: "عناصر غذائية", at: 4.8 },
      ],
    },
    {
      lines: [3],
      visual: { kind: "blood3d" },
      transition: "blur",
      sfx: "pulse",
      overlay: "*توازن* دقيق",
    },
    // Discovery
    { lines: [4], visual: { kind: "dna3d" }, transition: "sweep", sfx: "shimmer", overlay: "الأثر *الخفي*", lightSweep: true },
    // Solution
    {
      lines: [5, 6],
      visual: { kind: "steps", heading: "في مركز *الأثر* الخفي", items: ["تقييم المؤشرات الصحية", "تقييم التغذية ونمط الحياة", "خطة غذائية تناسبك"] },
      transition: "blur",
      sfx: "pop",
    },
    // CTA
    {
      lines: [7],
      visual: { kind: "end", cta: "احجز تقييمك اليوم", disclaimer: "التقييم استرشادي ولا يغني عن التشخيص الطبي أو التحاليل المخبرية." },
      transition: "sweep",
      sfx: "sweep",
    },
  ],
};
