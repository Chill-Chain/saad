"""Turn the white-background logo JPG into: logo.png (transparent) and logo-badge.png (logo on a soft paper circle)."""
import sys
import numpy as np
import cv2

src, out_dir = sys.argv[1], sys.argv[2]
im = cv2.imdecode(np.fromfile(src, dtype=np.uint8), cv2.IMREAD_COLOR).astype(np.float32)

# Alpha from distance to white (handles anti-aliased edges and light-teal strokes)
dist = 255.0 - im.min(axis=2)
alpha = np.clip((dist - 6.0) / 38.0, 0.0, 1.0)
# Un-premultiply against white so semi-transparent edges keep their true color
a = np.maximum(alpha, 1e-3)[..., None]
rgb = np.clip((im - 255.0 * (1.0 - a)) / a, 0, 255)
rgba = np.dstack([rgb, alpha * 255.0]).astype(np.uint8)

# Trim to content with a small margin
ys, xs = np.where(alpha > 0.02)
pad = 8
y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, rgba.shape[0])
x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, rgba.shape[1])
rgba = rgba[y0:y1, x0:x1]


def save(path, img):
    ok, buf = cv2.imencode(".png", img)
    buf.tofile(path)


save(f"{out_dir}/logo.png", rgba)

# Badge: white circle + soft shadow, logo centered — readable on any footage
h, w = rgba.shape[:2]
S = int(max(h, w) * 1.32)
badge = np.zeros((S, S, 4), np.float32)
yy, xx = np.mgrid[0:S, 0:S]
r = S * 0.46
c = S / 2
d = np.sqrt((xx - c) ** 2 + (yy - c - S * 0.012) ** 2)
shadow = np.clip((r + S * 0.03 - d) / (S * 0.03), 0, 1) * 0.22
circle = np.clip(r - np.sqrt((xx - c) ** 2 + (yy - c) ** 2) + 1, 0, 1)
paper = np.array([255, 255, 255], np.float32)  # white: the logo's native background (brand policy)
badge[..., :3] = paper
badge[..., 3] = np.maximum(circle, shadow)
badge[..., :3] *= (circle / np.maximum(badge[..., 3], 1e-3))[..., None]  # shadow is black
scale = (r * 2 * 0.80) / max(h, w)
lg = cv2.resize(rgba, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA).astype(np.float32)
lh, lw = lg.shape[:2]
oy, ox = int(c - lh / 2), int(c - lw / 2)
la = lg[..., 3:4] / 255.0
region = badge[oy:oy + lh, ox:ox + lw]
region[..., :3] = lg[..., :3] * la + region[..., :3] * (1 - la)
region[..., 3:4] = np.maximum(region[..., 3:4], la)
badge[..., 3] *= 255.0
save(f"{out_dir}/logo-badge.png", np.clip(badge, 0, 255).astype(np.uint8))
print("logo", rgba.shape, "badge", badge.shape)
