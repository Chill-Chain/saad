import type { VideoScript } from "./types";

/*
  ✍️ هذا ملف السكربت — عدّل النصوص والمدد هنا والفيديو يتحدث تلقائياً.

  أنواع المشاهد:
    hook     كلمة كبيرة في صندوق أحمر (+ boxes: عدد المربعات المرقمة تحتها)
    chapter  بطاقة رقم الفصل: kicker صغير + رقم ضخم + عنوان
    word     كلمة تنكتب حرف حرف مع خط زمني (مثل لقطة مونتاج)
    stretch  كلمة تتمدد بالكشيدة — stretchAfter = بعد أي حرف يبدأ المد
    counter  رقم يعدّ قدامك مع شريط تقدم
    icon     شكل يتحول لشكل ثاني (card / heart / star)
    end      بطاقة الختام: الاسم + الحساب + زرين

  لكل مشهد:
    duration  المدة بالثواني
    bg        paper (فاتح) | ink (أسود) | red | gray
    caption   النص فوق — حط *نجمتين* حول الكلمة اللي تبيها بصندوق أحمر
    chapter   رقم الفصل (يحرك الشرطات فوق ويكتب اسم الفصل)

  الصوت: حط الملفات في remotion-studio/public ثم اكتب أسماءها في voiceover / music
  نصيحة: سجّل الصوت أول، وبعدين خلّ مدة كل مشهد = مدة جملته (شغّل subtitles.ps1 على التسجيل يعطيك الأوقات)
*/
export const script: VideoScript = {
  chapters: ["الوقفة", "القص", "المد", "التحوّل", "العدّاد", "الختام"],
  handle: "@yourname",
  voiceover: undefined, // "voice.mp3"
  music: undefined, // "music.mp3"
  musicVolume: 0.12,

  scenes: [
    { type: "hook", duration: 2.6, chapter: 1, word: "وقّفتك؟", boxes: 6, caption: "هذي أول *حركة*" },
    { type: "hook", duration: 2.0, chapter: 1, word: "وقّفتك؟", boxes: 6, caption: "وعندي لك *خمس* غيرها" },

    { type: "chapter", duration: 1.2, chapter: 2, number: "02", kicker: "حركة", title: "القص على الكلمة" },
    { type: "word", duration: 2.4, chapter: 2, bg: "ink", word: "لقطة" },

    { type: "chapter", duration: 1.2, chapter: 3, number: "03", kicker: "حركة", title: "المد" },
    { type: "stretch", duration: 3.2, chapter: 3, word: "تتمدد", stretchAfter: 3, caption: "الكلمة العربية *تتمدد*" },

    { type: "chapter", duration: 1.2, chapter: 4, bg: "ink", number: "04", kicker: "حركة", title: "التحوّل" },
    { type: "icon", duration: 2.6, chapter: 4, bg: "ink", from: "card", to: "heart", fromLabel: "فكرة", toLabel: "إعجاب", caption: "شكل *يتحوّل* لشكل ثاني" },

    { type: "chapter", duration: 1.2, chapter: 5, bg: "ink", number: "05", kicker: "حركة", title: "العدّاد" },
    { type: "counter", duration: 2.8, chapter: 5, bg: "ink", to: 1041, label: "فريم في هالفيديو", caption: "*يعدّ* قدامك" },

    { type: "chapter", duration: 1.6, chapter: 6, number: "06", kicker: "الختام", title: "تبي تسوي مثله؟" },
    { type: "end", duration: 3.0, bg: "ink", name: "اسمك", handle: "@yourname", pills: ["الرابط في البايو", "تابعني"] },
  ],
};
