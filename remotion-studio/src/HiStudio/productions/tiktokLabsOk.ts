import type { Production } from "../types";

/*
  إعلان TikTok: «تحاليلك سليمة… بس ما تحس إنك بخير؟» — مركز الأثر الخفي
  الخطة: projects/tiktok-labs-ok/brief.md · الصوت: Microsoft Hamed (مجاني)
  السعر من hiddenimpactsa.com/ar (23-11-2026) — حدّثه إن تغيّر العرض.
*/
export const tiktokLabsOk: Production = {
  id: "tiktok-labs-ok",
  folder: "projects/tiktok-labs-ok",
  music: "ambient-hopeful",
  musicVolume: 0.22,
  captions: true,
  scenes: [
    // Hook — كل التحاليل "طبيعي"… ثم السؤال
    {
      lines: [0],
      visual: { kind: "labs", heading: "تحاليلك *سليمة*", rows: ["سكر الصيام", "صورة الدم", "الغدة الدرقية"], twist: "بس ما تحس إنك بخير؟", twistAt: 2.2 },
      sfx: "riser",
    },
    // Problem
    {
      lines: [1],
      visual: { kind: "cards", heading: "مهما *ارتحت*", items: [{ icon: "energy", label: "خمول" }, { icon: "sleep", label: "نوم ما يريّح" }, { icon: "focus", label: "تركيز مشتت" }] },
      transition: "zoom",
      sfx: "whoosh-soft",
    },
    // Explanation — داخل الجسم
    {
      lines: [2],
      visual: { kind: "cells3d" },
      transition: "zoom",
      sfx: "whoosh",
      overlay: "جسمك *يعوّض* بصمت",
      callouts: [
        { x: 0.62, y: 0.47, label: "طاقة الخلية", at: 2.4 },
        { x: 0.34, y: 0.6, label: "توازن السوائل", at: 4.4, side: "left" },
      ],
    },
    // Discovery
    { lines: [3], visual: { kind: "dna3d" }, transition: "sweep", sfx: "shimmer", overlay: "افهم *مؤشراتك* بدري", lightSweep: true },
    // Solution — التقنية
    { lines: [4], visual: { kind: "wave", label: "قراءة المؤشرات الحيوية" }, transition: "blur", sfx: "pulse", overlay: "تقييم *آمن* وغير جراحي" },
    // Solution — الرحلة
    {
      lines: [5],
      visual: { kind: "steps", heading: "رحلتك *معنا*", items: ["تحديد هدفك", "تقييم غير جراحي", "شرح النتيجة مع المختص ٣٠ دقيقة"] },
      transition: "blur",
      sfx: "pop",
    },
    // Offer
    {
      lines: [6],
      visual: { kind: "offer", name: "باقة الاستكشاف", nameEn: "DISCOVER", price: 349, oldPrice: 499, badge: "خصم", items: ["تقييم مختصر ١٠ دقائق", "تقرير المؤشرات العامة والتغذية", "شرح النتائج ٣٠ دقيقة"] },
      transition: "zoom",
      sfx: "hit",
    },
    // CTA
    {
      lines: [7],
      visual: { kind: "end", cta: "احجز تقييمك الآن", disclaimer: "التقييم استرشادي ولا يغني عن التشخيص الطبي أو التحاليل المخبرية." },
      transition: "sweep",
      sfx: "sweep",
    },
  ],
};