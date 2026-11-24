"""
Motion tracking: follow a region through a clip and export its centre per frame (normalized 0..1)
so Remotion callouts can stick to it.

  python track.py clip.mp4 out.json --box 0.42,0.30,0.12,0.10 [--at 0] [--fps 30]
  --box = x,y,w,h of the target at time --at, as fractions of the frame
"""
import argparse, json
import cv2


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--box", required=True)
    ap.add_argument("--at", type=float, default=0.0)
    ap.add_argument("--fps", type=float, default=30.0, help="output frame rate (composition fps)")
    a = ap.parse_args()

    cap = cv2.VideoCapture(a.video)
    if not cap.isOpened():
        raise SystemExit("cannot open video")
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30
    W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    x, y, w, h = [float(v) for v in a.box.split(",")]
    cap.set(cv2.CAP_PROP_POS_MSEC, a.at * 1000)
    ok, frame = cap.read()
    if not ok:
        raise SystemExit("cannot read start frame")
    tracker = cv2.TrackerMIL_create()
    tracker.init(frame, (int(x * W), int(y * H), int(w * W), int(h * H)))
    centres = [((x + w / 2), (y + h / 2))]
    last = centres[0]
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        found, b = tracker.update(frame)
        if found:
            c = ((b[0] + b[2] / 2) / W, (b[1] + b[3] / 2) / H)
            # light smoothing to avoid jitter on screen
            last = (last[0] * 0.6 + c[0] * 0.4, last[1] * 0.6 + c[1] * 0.4)
        centres.append(last)
    # resample from source fps to composition fps
    n_out = int(len(centres) / src_fps * a.fps)
    out = [{"x": round(centres[min(int(i * src_fps / a.fps), len(centres) - 1)][0], 4),
            "y": round(centres[min(int(i * src_fps / a.fps), len(centres) - 1)][1], 4)} for i in range(n_out)]
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(out, f)
    print(f"tracked {len(centres)} frames -> {n_out} points -> {a.out}")


if __name__ == "__main__":
    main()
