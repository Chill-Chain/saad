"""
Royalty-free sound kit, synthesized from scratch (no licensing issues):
  music  : calm cinematic ambient bed (soft pads + sparse felt-piano notes + long reverb)
  sfx    : whoosh, swoosh-soft, riser, hit, shimmer, pop, tick, pulse (heartbeat), sweep (light sweep)

  python sound_kit.py music out.wav --seconds 40 --mood calm|hopeful|deep --seed 3
  python sound_kit.py sfx   outdir
"""
import argparse
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000


def env_adsr(n, a, d, s, r):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    sustain = max(n - a - d - r, 0)
    e = np.concatenate([np.linspace(0, 1, a, False), np.linspace(1, s, d, False), np.full(sustain, s), np.linspace(s, 0, r)])
    return np.pad(e, (0, max(n - len(e), 0)))[:n]


def reverb_ir(seconds=3.5, damp=6000, seed=0):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    ir = rng.standard_normal((n, 2)) * np.exp(-np.linspace(0, 7, n))[:, None]
    sos = butter(2, damp, "low", fs=SR, output="sos")
    ir = sosfilt(sos, ir, axis=0)
    return ir / np.abs(ir).max()


def stereo_reverb(x, mix=0.35, seconds=3.5, seed=0):
    ir = reverb_ir(seconds, seed=seed)
    mono = x if x.ndim == 1 else x.mean(1)
    wet = np.stack([fftconvolve(mono, ir[:, 0])[: len(mono)], fftconvolve(mono, ir[:, 1])[: len(mono)]], 1)
    wet /= np.abs(wet).max() + 1e-9
    dry = np.stack([mono, mono], 1) if x.ndim == 1 else x
    return dry * (1 - mix) + wet * mix * np.abs(dry).max()


def norm(x, peak=0.89):
    return x / (np.abs(x).max() + 1e-9) * peak


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


# ───────────────────────── music ─────────────────────────
PROGRESSIONS = {
    # (chord root midi, chord intervals) — warm, unresolved, "clinical premium"
    "calm": [(48, [0, 7, 14, 16, 23]), (45, [0, 7, 15, 19, 26]), (41, [0, 7, 16, 19, 23]), (43, [0, 7, 14, 17, 21])],
    "hopeful": [(41, [0, 7, 16, 19, 26]), (43, [0, 7, 14, 16, 23]), (45, [0, 7, 15, 19, 22]), (48, [0, 7, 16, 19, 26])],
    "deep": [(45, [0, 7, 15, 19, 26]), (41, [0, 7, 16, 23, 26]), (48, [0, 7, 16, 19, 23]), (43, [0, 7, 14, 17, 22])],
}


def pad_voice(f, n, rng):
    t = np.arange(n) / SR
    v = np.zeros(n)
    for det in (-0.12, 0.0, 0.11):  # slight detune = width
        ff = f * 2 ** (det / 12)
        ph = rng.uniform(0, 2 * np.pi)
        v += np.sin(2 * np.pi * ff * t + ph) + 0.25 * np.sin(4 * np.pi * ff * t + ph) + 0.08 * np.sin(6 * np.pi * ff * t)
    lfo = 1 + 0.12 * np.sin(2 * np.pi * rng.uniform(0.05, 0.12) * t)
    return v * lfo


def piano_note(f, seconds, vel=1.0):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    tone = sum(np.sin(2 * np.pi * f * k * t) * (0.55 ** (k - 1)) * np.exp(-t * (1.2 + k * 0.9)) for k in range(1, 6))
    attack = np.minimum(t / 0.006, 1)
    return tone * attack * vel


def make_music(seconds, mood, seed):
    rng = np.random.default_rng(seed)
    prog = PROGRESSIONS[mood]
    n = int(seconds * SR)
    bar = 6.0  # seconds per chord: slow, breathing
    out = np.zeros(n)
    t0, ci = 0.0, 0
    while t0 < seconds:
        root, iv = prog[ci % len(prog)]
        seg = int(min(bar + 2.5, seconds - t0 + 2.5) * SR)
        chord = np.zeros(seg)
        for k in iv:
            chord += pad_voice(midi(root + k + 12), seg, rng) * (0.9 if k < 12 else 0.55)
        chord *= env_adsr(seg, 1.8, 0.5, 0.85, 2.4)
        s = int(t0 * SR)
        out[s: s + seg] += chord[: max(0, min(seg, n - s))]
        # sparse felt-piano motif
        for j in range(rng.integers(2, 4)):
            nt = t0 + rng.uniform(0.4, bar - 0.8)
            note = root + 24 + rng.choice(iv)
            p = piano_note(midi(note), 3.5, rng.uniform(0.35, 0.6))
            ps = int(nt * SR)
            if ps < n:
                out[ps: ps + len(p)] += p[: n - ps] * 1.6
        t0 += bar
        ci += 1
    sos = butter(2, [70, 5200], "band", fs=SR, output="sos")
    out = sosfilt(sos, out)
    st = stereo_reverb(norm(out), mix=0.45, seconds=4.5, seed=seed)
    fade = np.ones(n)
    fi, fo = int(2.0 * SR), int(3.0 * SR)
    fade[:fi] = np.linspace(0, 1, fi)
    fade[-fo:] = np.linspace(1, 0, fo)
    return norm(st * fade[:, None], 0.7)


# ───────────────────────── sfx ─────────────────────────
def noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n)


def sweep_bandpass(x, f0, f1):
    """time-varying bandpass by blending filtered slices"""
    out = np.zeros_like(x)
    steps = 48
    edges = np.linspace(0, len(x), steps + 1).astype(int)
    freqs = np.geomspace(f0, f1, steps)
    for i in range(steps):
        lo, hi = edges[i], edges[i + 1]
        fc = freqs[i]
        sos = butter(2, [fc / 1.6, min(fc * 1.6, SR / 2 - 100)], "band", fs=SR, output="sos")
        pad = 2048
        seg = x[max(lo - pad, 0): hi]
        out[lo:hi] = sosfilt(sos, seg)[-(hi - lo):]
    return out


def sfx_whoosh(dur=0.9, f0=300, f1=4500, seed=1):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    x = sweep_bandpass(noise(n, seed), f0, f1) * np.sin(np.pi * t) ** 1.5
    st = np.stack([x * (1 - t * 0.6), x * (0.4 + t * 0.6)], 1)  # pans across
    return norm(stereo_reverb(st, 0.2, 1.2, seed), 0.8)


def sfx_riser(dur=2.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * np.cumsum(np.geomspace(180, 900, n)) / SR) * 0.4
    x = (sweep_bandpass(noise(n, 4), 400, 7000) + tone) * (t / dur) ** 2
    return norm(stereo_reverb(x, 0.35, 2.0, 4), 0.8)


def sfx_hit(dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * np.cumsum(np.geomspace(120, 42, n)) / SR) * np.exp(-t * 5)
    click = sosfilt(butter(2, 2500, "high", fs=SR, output="sos"), noise(n, 7)) * np.exp(-t * 60) * 0.3
    return norm(stereo_reverb(body + click, 0.3, 2.2, 7), 0.9)


def sfx_shimmer(dur=2.0, seed=5):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for _ in range(14):
        st = rng.uniform(0, dur * 0.6)
        f = rng.choice([2093, 2349, 2637, 3136, 3520, 4186])
        tt = np.clip(t - st, 0, None)
        x += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 6) * (t >= st) * rng.uniform(0.3, 1)
    return norm(stereo_reverb(x, 0.55, 2.5, seed), 0.6)


def sfx_pop(dur=0.25):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(np.geomspace(900, 300, n)) / SR) * np.exp(-t * 30)
    return norm(stereo_reverb(x, 0.15, 0.6, 2), 0.7)


def sfx_tick(dur=0.12):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sosfilt(butter(2, [2000, 6000], "band", fs=SR, output="sos"), noise(n, 9)) * np.exp(-t * 90)
    return norm(np.stack([x, x], 1), 0.5)


def sfx_pulse(dur=1.4):
    n = int(dur * SR)
    out = np.zeros(n)
    for st, amp in ((0.0, 1.0), (0.28, 0.75)):
        s = int(st * SR)
        m = n - s
        t = np.arange(m) / SR
        out[s:] += np.sin(2 * np.pi * np.cumsum(np.geomspace(70, 40, m)) / SR) * np.exp(-t * 14) * amp
    return norm(stereo_reverb(out, 0.2, 1.0, 3), 0.85)


def sfx_sweep(dur=1.3):
    """soft airy light sweep (for logo/light passes)"""
    return norm(sfx_whoosh(dur, 1500, 9000, 11) * 0.6 + sfx_shimmer(dur, 12)[: int(dur * SR)] * 0.5, 0.6)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("kind", choices=["music", "sfx"])
    ap.add_argument("out")
    ap.add_argument("--seconds", type=float, default=40)
    ap.add_argument("--mood", default="calm", choices=list(PROGRESSIONS))
    ap.add_argument("--seed", type=int, default=3)
    a = ap.parse_args()
    if a.kind == "music":
        sf.write(a.out, make_music(a.seconds, a.mood, a.seed).astype(np.float32), SR)
        print("music ->", a.out)
        return
    from pathlib import Path
    d = Path(a.out)
    d.mkdir(parents=True, exist_ok=True)
    kit = {
        "whoosh": sfx_whoosh(), "whoosh-soft": sfx_whoosh(1.3, 200, 2500, 2) * 0.7, "riser": sfx_riser(),
        "hit": sfx_hit(), "shimmer": sfx_shimmer(), "pop": sfx_pop(), "tick": sfx_tick(),
        "pulse": sfx_pulse(), "sweep": sfx_sweep(),
    }
    for k, v in kit.items():
        v = v if v.ndim == 2 else np.stack([v, v], 1)
        sf.write(str(d / f"{k}.wav"), v.astype(np.float32), SR)
        print("sfx ->", d / f"{k}.wav")


if __name__ == "__main__":
    main()
