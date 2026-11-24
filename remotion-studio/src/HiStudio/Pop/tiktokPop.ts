import type { PopProduction } from "./PopAd";

/*
  إعلان TikTok — النسخة الثانية بنمط «Pop» (كلمات متزامنة مع الصوت + قطع Glitch + عناصر واجهة)
  الصوت: ElevenLabs — منصور (eleven_v4) · projects/tiktok-pop/
*/
export const tiktokPop: PopProduction = {
  id: "tiktok-pop",
  folder: "projects/tiktok-pop",
  music: "ambient-hopeful",
  musicVolume: 0.24,
  scenes: [
    { lines: [0], text: "سوّيت تحاليلك|كلها *سليمة*", prop: { kind: "rec" }, sfx: "riser", pose: "point" },
    { lines: [1], text: "ليش للحين|تصحى *تعبان*؟", prop: { kind: "battery" }, sfx: "whoosh", pose: "rest" },
    { lines: [2], text: "*الغلط*|اللي نسويه كلنا", prop: { kind: "wrong", note: "عادي.. ضغط وبيروح" }, sfx: "hit", pose: "point" },
    { lines: [3], text: "جسمك *يعوّض*|بصمت", prop: { kind: "stars", labels: ["طاقة", "", "خلايا", "تركيز", "نوم", ""] }, sfx: "shimmer", pose: "present" },
    { lines: [4], kicker: "مركز الأثر الخفي", text: "تقييم|*غير جراحي*", prop: { kind: "progress", label: "قراءة المؤشرات" }, sfx: "whoosh-soft", pose: "point" },
    { lines: [5], text: "مع *المختص*", prop: { kind: "count", to: 30, unit: "دقيقة شرح لنتيجتك" }, sfx: "tick", pose: "present" },
    { lines: [6], kicker: "صدقني", text: "أول *خطوة*|تفهم فيها جسمك", prop: { kind: "quote", chips: ["تقرير واضح", "شرح مختص", "غير جراحي"] }, sfx: "pop", pose: "point" },
    { lines: [7], text: "باقة *الاستكشاف*", prop: { kind: "price", name: "DISCOVER", price: 349, old: 499 }, sfx: "hit", pose: "present" },
    { lines: [8], prop: { kind: "end", cta: "احجز الحين", disclaimer: "التقييم استرشادي ولا يغني عن التشخيص الطبي أو التحاليل المخبرية." }, sfx: "sweep" },
  ],
};