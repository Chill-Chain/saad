"""Align a whole-take voice-over (e.g. ElevenLabs) to the lines of vo.txt using whisper.cpp word timestamps.

usage: align_vo.py <words.json from whisper-cli -ml 1 -sow -oj> <vo.txt> <voice.wav duration s> <out dir> [provider label]
writes timings.json ({provider, voice, duration, lines:[{i,text,start,end,words:[{w,start,end}]}]}) and voice.srt
Each line is anchored on its first word (normalized), searched forward in the transcript.
"""
import json, re, sys
from pathlib import Path

TASHKEEL = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]")
PUNCT = re.compile(r"[^\w]", re.UNICODE)


def norm(w: str) -> str:
    w = TASHKEEL.sub("", w)
    w = PUNCT.sub("", w)
    return w.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه").replace("ى", "ي")


def vo_lines(path: Path):
    out = []
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        s = raw.strip()
        if not s or s.startswith("#") or re.match(r"^\[pause", s):
            continue
        s = re.sub(r"\[[^\]]*\]", "", s).strip()  # drop inline [emotion] tags
        out.append(s)
    return out


def ts(x: float) -> str:
    ms = int(round(x * 1000))
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


def main():
    words_json, vo, dur, out_dir = sys.argv[1], Path(sys.argv[2]), float(sys.argv[3]), Path(sys.argv[4])
    label = sys.argv[5] if len(sys.argv) > 5 else "external"
    data = json.loads(Path(words_json).read_text(encoding="utf-8"))
    words = [
        {"w": t["text"].strip(), "start": t["offsets"]["from"] / 1000, "end": t["offsets"]["to"] / 1000}
        for t in data["transcription"]
        if t["text"].strip()
    ]
    lines = vo_lines(vo)
    idx, k = [], 0
    for li, line in enumerate(lines):
        first = norm(line.split()[0])
        found = next((j for j in range(k, len(words)) if norm(words[j]["w"]) == first), None)
        if found is None:  # fall back: proportional position
            found = min(len(words) - 1, max(k, round(len(words) * li / len(lines))))
            print(f"  ! anchor not found for line {li} ({line.split()[0]}), using word {found}")
        idx.append(found)
        k = found + 1
    res, srt = [], []
    for i, line in enumerate(lines):
        a = idx[i]
        b = (idx[i + 1] - 1) if i + 1 < len(lines) else len(words) - 1
        ws = words[a : b + 1]
        s, e = ws[0]["start"], ws[-1]["end"]
        res.append({"i": i, "text": line, "start": round(s, 3), "end": round(e, 3), "words": ws})
        srt.append(f"{i + 1}\n{ts(s)} --> {ts(e)}\n{line}\n")
        print(f"  [{i}] {s:6.2f}-{e:6.2f}  {line}")
    (out_dir / "timings.json").write_text(json.dumps({"provider": label, "voice": label, "duration": round(dur, 3), "lines": res}, ensure_ascii=False, indent=1), encoding="utf-8")
    (out_dir / "voice.srt").write_text("\n".join(srt), encoding="utf-8")


if __name__ == "__main__":
    main()
