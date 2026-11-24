# المشاهد واللقطات — التفاصيل

## 1. كتالوج المشاهد (HiStudio)
| kind | الاستخدام | ملاحظات |
|---|---|---|
| `title` | هوك أو عنوان فصل | كلمة مفتاحية بين `*نجمتين*` |
| `footage` | لقطات واقعية: أشخاص، حياة يومية، المركز، Macro | `src` في public، `zoom` (دفع)، `dof`، `rate`، `startFrom` |
| `parallax` | صورة بعمق 2.5D | `bg` + `fg` مقصوص (`remove-bg.ps1`) |
| `cells3d` | داخل الجسم: خلايا ونوى زجاجية | كاميرا dolly + ضباب عمق |
| `blood3d` | دورة دموية: كريات حمراء بشكل مقعر الوجهين داخل وعاء | الشكل دقيق تشريحياً (Evans–Fung) |
| `dna3d` | الجينات، العمق، «الأثر الخفي» | أخضر + ذهبي |
| `cards` | المشكلة/الأعراض/الفوائد | 3–4 بطاقات بأيقونات خطية |
| `steps` | الحل وخطوات التجربة | مرقمة بالذهبي |
| `end` | الختام | الشعار، الدعوة، التواصل، الإخلاء |

إضافات لأي مشهد: `overlay` (عنوان ≤ 6 كلمات)، و`callouts` (تعليقات طبية متحركة، أو متتبعة بـ `track`)، و`lightSweep`، و`transition`، و`sfx`.

### إضافة مشهد 3D جديد (عضو، نسيج، جزيئات)
1. أنشئ مكوناً في `src/HiStudio/Medical3D.tsx` بنفس النمط: `Canvas` + `Lights` + `Rig` (حركة الكاميرا) وكل الحركة من `useCurrentFrame`.
2. المواد: `meshPhysicalMaterial` (transmission/clearcoat للزجاج) بألوان الهوية فقط، والأحمر `HI.rbc` للدم فقط.
3. للأعضاء الحقيقية استخدم نموذج GLTF مرخصاً (مثل NIH 3D Print Exchange أو BodyParts3D بترخيص CC-BY مع ذكر المصدر) عبر `useGLTF`/`GLTFLoader`. لا ترسم عضواً تقريبياً يبدو مشوهاً.
4. أضف `kind` جديداً في `types.ts` و`VisualView`.

## 2. مصادر اللقطات بالترتيب
1. **لقطات المستخدم / تصوير المركز**: الأصدق، ولكل من يظهر موافقة.
2. **Stock مرخص تجارياً**: `stock.ps1 <project> "<english query>" -Orientation portrait -Count 3` (Pexels، مفتاح مجاني). يُحفظ `credits.txt`.
   استعلامات مفيدة: `woman waking up tired morning`, `man office fatigue`, `healthy breakfast macro`, `doctor consultation clinic`, `blood test lab` (للسياق فقط، لا للادعاء)، `walking park sunrise`.
   فضّل لقطات بإضاءة ناعمة وخلفيات فاتحة وألوان قريبة من الهوية، وتجنب الوجوه المتكررة بين المشاهد إلا إن كانت نفس الشخصية.
3. **توليد بالذكاء الاصطناعي** (مهارة `image-generation`، أو CoDesign `asset_generate` بقدرات text2image/text2video/image2video بعد تسجيل الدخول):
   - **شخصية ثابتة:** اكتب «بطاقة شخصية» واحدة واستخدمها حرفياً في كل لقطة، مثلاً: *Saudi woman, early 30s, soft natural makeup, beige hijab, cream knit sweater, warm skin tone, gentle expression*، واستخدم أول صورة مرجعاً (image2image / image2video) للّقطات التالية.
   - **أسلوب ثابت:** *cinematic, soft diffused daylight, clean white and warm ivory interior, subtle sage green accents, shallow depth of field, 35mm, premium healthcare commercial, photorealistic*.
   - **طبي توضيحي:** *high-end 3D medical visualization, translucent glass-like anatomy, accurate anatomical proportions, soft studio lighting, ivory background, sage green and champagne gold accents, no blood, no gore*.
   - افحص كل صورة: أيدٍ وأصابع، تشريح، نص مشوه (احذف أي نص مولّد). المرفوض يُعاد توليده.
4. **3D إجرائي** في Remotion للخلايا والدم وDNA (دقيق ومتّسق ولا يحتاج أصول).
5. **Infographics** (`cards`, `steps`, callouts) للمفاهيم المجردة.

## 3. الإيقاع والتنويع
- إعلان 30 ث: 7–10 مشاهد، و3 أنواع على الأقل، ولقطة واقعية واحدة على الأقل للبُعد الإنساني.
- تثقيفي 60 ث: 10–14 مشهداً، و40% منها داخل الجسم (3D/تشريح).
- لا يتكرر نفس `kind` في مشهدين متتاليين إلا بتغيير زاوية الكاميرا أو الخلفية بوضوح.
- Match cut مقترح: دائرة في البطاقة ← خلية، عين ← عدسة الكاميرا ← خلية، نبض الأيقونة ← تدفق الدم.

## 4. معالجة اللقطات قبل الإدخال
| الحاجة | الأمر |
|---|---|
| تثبيت | `stabilize.ps1` |
| Speed ramp | `speed-ramp.ps1 -At 2 -Hold 1.2 -Slow 0.35` |
| إزالة خلفية (لـ parallax) | `remove-bg.ps1` |
| رفع جودة صورة/لقطة | `upscale.ps1` |
| حركة ناعمة/سلو موشن | `smooth-motion.ps1` |
| تتبع عنصر | `track.ps1 -Box "x,y,w,h"` |
| تلوين أولي قريب من الهوية | `color-grade.ps1 -Preset clean` (الدرجة النهائية في Remotion) |

## 5. الصور والتصاميم الثابتة
- نفس الهوية (ألوان، خطوط، زجاج، ذهبي دقيق).
- **كل صورة نهائية تحمل الشعار**: `brand-image.ps1 <file>` (الشارة البيضاء في الزاوية المحددة في brand.json).
- المقاسات: 1080x1080، 1080x1350، 1080x1920 (ستوري)، و1920x1080.
