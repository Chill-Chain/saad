# الاستوديو المحلي — الأوامر والملفات

المجلد: `C:\Projects\ai vedio edetor` (مُزامَن بين الأجهزة عبر Git — انظر `SETUP.md`؛ PowerShell على Windows، شغّل الأوامر من جذر المجلد).

## البنية
```
brand/                      الشعار (original/logo/logo-badge) + brand.json + audio/ (music, sfx)
projects/<name>/            brief.md · vo.txt · voice.wav · timings.json · voice.srt · media/
remotion-studio/
  src/HiStudio/             brand.ts · types.ts · Primitives.tsx · Medical3D.tsx · Visuals.tsx · HiAd.tsx
  src/HiStudio/productions/ <name>.ts  (خطة المشاهد)
  src/Root.tsx              تسجيل الإنتاج (PRODUCTIONS) → <name>-9x16 / -16x9 / -1x1
  public/                   brand/ · audio/ · projects/<name>/
scripts/                    أدوات PowerShell (تضع الشعار تلقائياً على كل فيديو نهائي)
Final videos/<name>/        المخرجات
```

## سير العمل لإعلان جديد
```powershell
# 1) الخطة والنص
mkdir projects\<name>; # اكتب brief.md و vo.txt
# 2) الصوت
.\scripts\voiceover.ps1 projects\<name>\vo.txt [-Gender male] [-Provider elevenlabs -Voice <id>]
# 3) اللقطات
.\scripts\stock.ps1 <name> "<query>" -Orientation portrait -Count 3
# 4) خطة المشاهد: انسخ src/HiStudio/productions/fatigue.ts إلى <name>.ts، عدّل id/folder/scenes، وسجّله في PRODUCTIONS في Root.tsx
# 5) المعاينة
cd remotion-studio; npm run dev
# 6) التصدير (كل المقاسات + ضبط الصوت)
.\scripts\hi-ad.ps1 <name>            # 1080p
.\scripts\hi-ad.ps1 <name> -UHD       # 4K
```

## الأدوات
| الأمر | الوظيفة |
|---|---|
| `voiceover.ps1` | تعليق صوتي + توقيتات + SRT |
| `hi-ad.ps1` | إنتاج كامل بكل المقاسات |
| `stock.ps1` | لقطات Pexels |
| `track.ps1` | تتبع حركة لعنصر داخل لقطة |
| `speed-ramp.ps1` | تبطيء متدرج |
| `brand-image.ps1` | الشعار على صورة |
| `add-logo.ps1` | الشعار على فيديو جاهز |
| `subtitles.ps1` | تفريغ وترجمة (whisper.cpp) |
| `clean-audio.ps1` | تنظيف تسجيل صوتي بشري |
| `remove-bg.ps1` · `upscale.ps1` · `smooth-motion.ps1` · `stabilize.ps1` · `color-grade.ps1` · `vertical.ps1` · `cut-silence.ps1` · `separate-voice.ps1` | معالجة اللقطات |
| `scripts/py/sound_kit.py music <out.wav> --seconds 60 --mood calm` | موسيقى جديدة بلا حقوق |
| `analyze-reference.ps1` | تحليل فيديو مرجعي للاستلهام |

## ملاحظات تقنية
- مسار المجلد فيه عربي: whisper.cpp وOpenCV ومرشحات ffmpeg تُشغَّل عبر مجلد مؤقت ASCII (الأدوات تتولى ذلك).
- ملفات PowerShell تُحفظ UTF-8 **مع BOM**.
- المشاهد ثلاثية الأبعاد تحتاج WebGL: `Config.setChromiumOpenGlRenderer("angle")` مفعّل.
- لا يوجد كرت NVIDIA: Whisper يعمل على المعالج، وReal-ESRGAN وRIFE على Vulkan.
