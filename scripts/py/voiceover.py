"""
Voice-over builder: one sentence per line -> voice.wav + timings.json + voice.srt

Providers
  elevenlabs : best natural Saudi delivery. Needs env ELEVENLABS_API_KEY (+ --voice <voice_id>).
  edge       : free Microsoft neural voices (ar-SA-ZariyahNeural female / ar-SA-HamedNeural male).
  auto       : elevenlabs if the key exists, else edge.

Line syntax (script file, UTF-8):
  جسمك يرسل لك إشارات كل يوم.
  [pause=0.8]                      <- extra silence before the next line
  # comment lines are ignored
"""
import argparse, asyncio, json, os, re, subprocess, sys, tempfile, urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48000


def run(cmd):
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode:
        sys.exit(f"command failed: {' '.join(map(str, cmd))}\n{r.stderr.decode(errors='ignore')[-800:]}")


def parse(path: Path):
    items, pause = [], 0.0
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        m = re.fullmatch(r"\[pause=([\d.]+)\]", line)
        if m:
            pause += float(m.group(1))
            continue
        items.append({"text": line, "pause_before": pause})
        pause = 0.0
    return items


async def edge_say(text, voice, rate, pitch, out_mp3):
    import edge_tts
    await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(str(out_mp3))


def eleven_say(text, voice_id, model, prev_text, next_text, out_mp3, stability, style):
    key = os.environ["ELEVENLABS_API_KEY"]
    body = {
        "text": text,
        "model_id": model,
        "voice_settings": {"stability": stability, "similarity_boost": 0.8, "style": style, "use_speaker_boost": True},
    }
    # continuity hints keep intonation natural across separately generated lines (not supported by v3)
    if not model.startswith("eleven_v3"):
        if prev_text:
            body["previous_text"] = prev_text
        if next_text:
            body["next_text"] = next_text
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128",
        data=json.dumps(body).encode("utf-8"),
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        out_mp3.write_bytes(r.read())


def to_array(mp3: Path, wav: Path):
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(mp3), "-ac", "1", "-ar", str(SR), str(wav)])
    a, _ = sf.read(str(wav), dtype="float32")
    # trim leading/trailing silence so our own pauses control the rhythm
    idx = np.where(np.abs(a) > 0.004)[0]
    if len(idx):
        a = a[max(idx[0] - int(0.03 * SR), 0): idx[-1] + int(0.06 * SR)]
    return a


def srt_time(t):
    h, m = int(t // 3600), int(t % 3600 // 60)
    s = t % 60
    return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s % 1) * 1000)):03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("outdir")
    ap.add_argument("--provider", default="auto", choices=["auto", "edge", "elevenlabs"])
    ap.add_argument("--voice", default="")
    ap.add_argument("--gender", default="female", choices=["female", "male"])
    ap.add_argument("--rate", default="-6%", help="edge only, e.g. -6%")
    ap.add_argument("--pitch", default="+0Hz", help="edge only")
    ap.add_argument("--model", default="eleven_multilingual_v2", help="elevenlabs model id (eleven_v3 for most expressive)")
    ap.add_argument("--stability", type=float, default=0.45)
    ap.add_argument("--style", type=float, default=0.35)
    ap.add_argument("--gap", type=float, default=0.28, help="natural breath between lines (s)")
    ap.add_argument("--lead", type=float, default=0.35, help="silence before the first line (s)")
    a = ap.parse_args()

    provider = a.provider
    if provider == "auto":
        provider = "elevenlabs" if os.environ.get("ELEVENLABS_API_KEY") else "edge"
    if provider == "elevenlabs" and not a.voice:
        sys.exit("ElevenLabs needs --voice <voice_id> (pick a Saudi / Khaleeji voice from your ElevenLabs voice library)")
    voice = a.voice or ("ar-SA-ZariyahNeural" if a.gender == "female" else "ar-SA-HamedNeural")

    items = parse(Path(a.script))
    if not items:
        sys.exit("script is empty")
    out = Path(a.outdir)
    out.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="hi_vo_"))

    chunks, timings, t = [np.zeros(int(a.lead * SR), np.float32)], [], a.lead
    for i, it in enumerate(items):
        mp3, wav = tmp / f"{i}.mp3", tmp / f"{i}.wav"
        if provider == "edge":
            asyncio.run(edge_say(it["text"], voice, a.rate, a.pitch, mp3))
        else:
            prev_t = items[i - 1]["text"] if i else ""
            next_t = items[i + 1]["text"] if i + 1 < len(items) else ""
            eleven_say(it["text"], voice, a.model, prev_t, next_t, mp3, a.stability, a.style)
        seg = to_array(mp3, wav)
        if i:
            gap = a.gap + it["pause_before"]
            chunks.append(np.zeros(int(gap * SR), np.float32))
            t += gap
        start = t
        chunks.append(seg)
        t += len(seg) / SR
        timings.append({"i": i, "text": it["text"], "start": round(start, 3), "end": round(t, 3)})
        print(f"  [{i}] {start:6.2f}-{t:6.2f}  {it['text']}")
    chunks.append(np.zeros(int(0.6 * SR), np.float32))
    raw = out / "voice.raw.wav"
    sf.write(str(raw), np.concatenate(chunks), SR)

    # Broadcast-style VO chain: clean lows, presence, gentle compression, -16 LUFS
    chain = ("highpass=f=75,equalizer=f=3200:t=q:w=1.2:g=2,equalizer=f=250:t=q:w=1:g=-1.5,"
             "acompressor=threshold=-18dB:ratio=2.5:attack=8:release=120:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=7")
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw), "-af", chain, "-ar", str(SR), str(out / "voice.wav")])
    raw.unlink()

    total = round(t + 0.6, 3)
    (out / "timings.json").write_text(json.dumps({"provider": provider, "voice": voice, "duration": total, "lines": timings}, ensure_ascii=False, indent=2), encoding="utf-8")
    with open(out / "voice.srt", "w", encoding="utf-8") as f:
        for k, x in enumerate(timings, 1):
            f.write(f"{k}\n{srt_time(x['start'])} --> {srt_time(x['end'])}\n{x['text']}\n\n")
    print(f"voice: {provider} / {voice}  duration {total}s -> {out}")


if __name__ == "__main__":
    main()
