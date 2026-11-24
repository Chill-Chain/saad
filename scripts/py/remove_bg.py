"""Remove image background with rembg (Python API; the rembg CLI hangs on this machine)."""
import sys
from PIL import Image
from rembg import remove, new_session
src, dst = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else "u2net"
remove(Image.open(src), session=new_session(model)).save(dst)
print("saved", dst)