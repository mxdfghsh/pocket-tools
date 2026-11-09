#!/usr/bin/env python3
"""AI-upscale gold-miner 1x WebP assets → @2x/@3x using Real-ESRGAN (CPU/spandrel)."""
import os, sys, time
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path('/workspace/gold-miner')
ASSETS = ROOT / 'assets'
sys.path.insert(0, '/workspace/lfz-remake/tools')
import importlib.util
spec = importlib.util.spec_from_file_location('upscale', '/workspace/lfz-remake/tools/upscale.py')
u = importlib.util.module_from_spec(spec)
spec.loader.exec_module(u)

MODEL = os.environ.get('HD_MODEL', 'realesr-animevideov3')
# Prefer anime model for Flash cartoon art

def save_webp(im: Image.Image, path: Path, q=90):
  path.parent.mkdir(parents=True, exist_ok=True)
  im.save(path, 'WEBP', quality=q, method=6)

def up_one(src: Path, scale: int, dest: Path):
  if dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime and dest.stat().st_size > 200:
    # Force re-upscale for shop faces always
    if 'shop_bg' not in src.name:
      return 'skip'
  im = Image.open(src).convert('RGBA')
  arr = np.asarray(im)
  # Network always 4x then downsample for 2/3
  out4 = u.upscale_rgba(arr, out_scale=4, model=MODEL)
  if scale == 4:
    out = out4
  else:
    h, w = arr.shape[0] * scale, arr.shape[1] * scale
    out = u.resize(out4, w, h, Image.LANCZOS)
  save_webp(Image.fromarray(out), dest, q=90 if scale <= 2 else 88)
  return f'{im.size}->{(out.shape[1], out.shape[0])}'

def main():
  ones = sorted(ASSETS.rglob('*.webp'))
  ones = [p for p in ones if '@2x' not in p.name and '@3x' not in p.name]
  # Priority first
  def prio(p):
    n = str(p)
    if 'shop_bg' in n: return 0
    if 'title' in n or 'play_bg' in n or 'goal' in n: return 1
    if '/items/' in n or '/hook/' in n: return 2
    if '/miner/' in n and 'pull_frames' not in n: return 3
    if '/shop/' in n: return 4
    return 5
  ones.sort(key=prio)
  print(f'{len(ones)} assets, model={MODEL}', flush=True)
  t0 = time.time()
  for i, src in enumerate(ones, 1):
    for scale, tag in ((2, '@2x'), (3, '@3x')):
      dest = src.with_name(src.stem + tag + '.webp')
      try:
        st = up_one(src, scale, dest)
        print(f'[{i}/{len(ones)}] {src.relative_to(ASSETS)} x{scale}: {st}', flush=True)
      except Exception as e:
        print(f'FAIL {src} x{scale}: {e}', flush=True)
  print(f'done in {time.time()-t0:.1f}s', flush=True)

if __name__ == '__main__':
  main()
