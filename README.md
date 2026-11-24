# بيئة المونتاج

## هيكل المجلد
| المجلد | الاستخدام |
|---|---|
| `raw footage/` | المواد الخام |
| `Refrences/` | الفيديوهات المرجعية، والتحليلات في `_analysis/` |
| `Final videos/` | المخرجات النهائية (السكربتات تحفظ هنا تلقائياً) |
| `scripts/` | أوامر التجميل الجاهزة ⬇️ |
| `remotion-studio/` | فيديو بالكود (React)، فيه قالب **Kinetic** |
| `hyperframes-studio/` | فيديو بالكود (HTML) |
| `tools/` | whisper.cpp، Real-ESRGAN، RIFE |
| `.venv/` | Python: Whisper، yt-dlp، auto-editor، Demucs، rembg… |

> شغّل كل الأوامر من هذا المجلد. لو طلع لك خطأ صلاحيات أول مرة:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## أوامر التجميل (`scripts/`)
| الأمر | وش يسوي |
|---|---|
| `.\scripts\polish.ps1 "raw footage\x.mp4" -Preset cinematic` | **تجميل شامل بأمر واحد**: تلوين + حدّة + تنعيم + تنظيف الصوت (`-Vertical` `-Subtitles`) |
| `.\scripts\clean-audio.ps1 x.mp4` | إزالة الضجيج وتوحيد الصوت على −14 LUFS (`-Strong` إزالة أقوى بالذكاء الاصطناعي) |
| `.\scripts\subtitles.ps1 x.mp4 -Burn` | ترجمة عربية تلقائية وحرقها على الفيديو (بدون `-Burn` يطلع ملف SRT بس) |
| `.\scripts\color-grade.ps1 x.mp4 -Preset moody` | تلوين: cinematic / warm / cool / vivid / moody / bw / clean، أو `-Lut file.cube` |
| `.\scripts\stabilize.ps1 x.mp4` | تثبيت التصوير المهزوز |
| `.\scripts\cut-silence.ps1 x.mp4` | قص السكتات تلقائياً (`-Premiere` يطلع XML لبريمير/دافينشي) |
| `.\scripts\vertical.ps1 x.mp4` | تحويل لـ 9:16 بخلفية مموهة (`-Crop` قص بدل التمويه) |
| `.\scripts\upscale.ps1 x.mp4` | رفع الجودة ×2 بالذكاء الاصطناعي (ويشتغل على الصور بعد) |
| `.\scripts\smooth-motion.ps1 x.mp4` | مضاعفة الإطارات لحركة ناعمة (`-Slowmo` سلو موشن) |
| `.\scripts\separate-voice.ps1 x.mp4` | فصل الصوت عن الموسيقى (`-ReplaceAudio` يشيل الموسيقى) |
| `.\scripts\remove-bg.ps1 x.jpg` | إزالة الخلفية من صورة (PNG) أو فيديو (WebM شفاف) |
| `.\scripts\split-scenes.ps1 x.mp4` | تقسيم الفيديو الطويل لمشاهد |
| `.\scripts\analyze-reference.ps1 "Refrences\x.mp4"` | تحليل فيديو مرجعي: الإيقاع، الألوان، الصوت، الكلام، صور |

## قالب Kinetic (بأسلوب فيديو 1)
فيديو كتابة عربية متحركة 9:16. الدليل الكامل في `Refrences\_analysis\فيديو_1\STYLE.md`.
1. عدّل النصوص والمدد في `remotion-studio\src\Kinetic\script.ts`
2. عاين: `cd remotion-studio` ثم `npm run dev`
3. صدّر: `npx remotion render Kinetic "..\Final videos\my-reel.mp4"`

مكتبات Remotion المضافة: transitions, captions, google-fonts, motion-blur, noise, shapes, paths, lottie, gif, light-leaks, layout-utils, media.

## الأدوات المباشرة
فعّل بيئة Python أولاً: `.\.venv\Scripts\Activate.ps1`

```powershell
yt-dlp -o "Refrences\%(title)s.%(ext)s" "الرابط"      # تحميل (من هذا المجلد عشان يقرأ yt-dlp.conf)
whisper x.mp4 --model turbo --language ar --output_format srt
ffmpeg -i in.mp4 -ss 5 -to 20 -c copy out.mp4
auto-editor x.mp4 --margin 0.2sec
demucs --two-stems=vocals x.wav
rembg i in.jpg out.png
```

**HyperFrames:** `cd hyperframes-studio` ثم `npm run dev` / `npm run render`

## ملاحظات
- ما فيه كرت NVIDIA: Whisper و Demucs يشتغلون على المعالج. Real-ESRGAN و RIFE يشتغلون على كرت AMD عبر Vulkan
- whisper.cpp أسرع بكثير من Whisper العادي، وهو اللي تستخدمه `subtitles.ps1`
- رفع الجودة والحركة الناعمة بطيئين، فجرّبهم على مقطع قصير أول
