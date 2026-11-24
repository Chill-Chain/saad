# Video editing workspace

## Brand rule (non-negotiable)
Every video, image or design produced from this folder must carry the brand logo.
- Logo files: `brand/logo-badge.png` (round paper badge — default, readable on any footage), `brand/logo.png` (transparent), `brand/logo-original.jpg` (source).
- Placement settings: `brand/brand.json` (position, width %, margin %, opacity). Change placement there, not in scripts.
- `scripts/*.ps1`: every script that outputs a final video calls `Add-Logo` (in `_common.ps1`). New scripts must do the same and accept `-NoLogo`. Multi-step scripts set `$env:HI_NO_LOGO=1` for inner steps and stamp once at the end (see `polish.ps1`).
- Remotion (`remotion-studio`): every composition renders `<BrandLogo />` from `src/Brand.tsx`; end cards use `<BrandMark />`. Logo copies live in `public/brand/`.
- HyperFrames (`hyperframes-studio`): keep the `#brand-logo` clip in each composition, with `data-duration` equal to the composition's duration. Logo copies live in `assets/brand/`.
- If the logo in `brand/` changes, re-copy it into `remotion-studio/public/brand/` and `hyperframes-studio/assets/brand/`.

## Environment notes
- Windows PowerShell 5.1. Scripts must be saved as UTF-8 **with BOM** (Arabic text/paths break otherwise).
- Location: `C:\Projects\ai vedio edetor`, synced between PCs with Git (not OneDrive) — see `SETUP.md`. `git pull` before work, commit + push after. `.venv`, `node_modules`, `tools/` are per-machine and not in Git.
- Finished videos: `Final videos/` is a junction to `%USERPROFILE%\OneDrive\Hidden Impact Videos` (synced by OneDrive, ignored by Git).
- Older copies of this folder lived under `OneDrive\سطح المكتب` (Arabic path). whisper.cpp and ffmpeg filter arguments (subtitles, lut3d, vidstab) can't take Arabic paths — keep using an ASCII temp folder for those (see `subtitles.ps1`, `analyze-reference.ps1`).
- In PS 5.1 with `$ErrorActionPreference='Stop'`, redirecting a native tool's stderr (`2>&1`, `2>$null`) throws; switch to `Continue` around those calls.
- No NVIDIA GPU (AMD Radeon): Whisper/Demucs run on CPU; Real-ESRGAN/RIFE use Vulkan.
- Python tools live in `.venv`; binaries in `tools/` (whisper.cpp under `tools/whisper-cpp/Release`).

## Hidden Impact ad studio
- Skill: `luxury-medical-motion-ads` (source of truth: `skill-source/luxury-medical-motion-ads/`, repack with `skill-source/pack.ps1`, then re-upload to claude.ai). Follow it for every Hidden Impact video: brief first, voice-over first, ≥3 scene types, logo, compliance.
- Remotion: `remotion-studio/src/HiStudio` (brand tokens from the design system, 3D scenes, captions, ducked music, end card). Productions in `src/HiStudio/productions/<name>.ts`, registered in `Root.tsx` → `<name>-9x16|16x9|1x1`.
- Projects: `projects/<name>/` (brief.md, vo.txt, voice.wav, timings.json, media/). One command: `scripts/hi-ad.ps1 <name> [-UHD]`.
- Audio: `scripts/voiceover.ps1` (ElevenLabs if `ELEVENLABS_API_KEY`, else Microsoft ar-SA Zariyah/Hamed), royalty-free music/SFX in `brand/audio` (made by `scripts/py/sound_kit.py`).
- Brand palette/fonts/contact come from `%USERPROFILE%\OneDrive\سطح المكتب\cloude\hidden-impact-design-system\hidden-impact\brand-library\` — never invent colors or contact details.

## Style references
`Refrences/_analysis/<name>/STYLE.md` — style breakdowns. The Kinetic Remotion template (`remotion-studio/src/Kinetic`, edit `script.ts`) reproduces `فيديو 1`.
