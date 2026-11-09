#!/usr/bin/env python3
"""Re-render blurry items straight from SWF vectors (FFDec -zoom export) — no AI upscaling.

Inputs (FFDec CLI, openjdk-21):
  ffdec-cli -format sprite:png -zoom 6  -selectid 281 -export sprite /tmp/gmx6; -zoom 6 -selectid 253,271,275 -> /tmp/gmx game.swf
  ffdec-cli -format sprite:png -zoom 3  -selectid 253,271,275     -export sprite /tmp/gmx3 game.swf
  ffdec-cli -format sprite:png -zoom 10 -selectid 321             -export sprite /tmp/gmx10 game.swf
"""
from pathlib import Path
from PIL import Image

A = Path('/workspace/gold-miner/assets')
X1 = Path('/workspace/4399-1602/ffdec-export/sprites')
def save(im, p, q=90):
    p.parent.mkdir(parents=True, exist_ok=True)
    im.save(p, 'WEBP', quality=q, method=6)

# 1) Bone (DefineSprite_321) — tight alpha crop, 1x/2x/3x
bone = Image.open('/tmp/gmx10/DefineSprite_321/1.png').convert('RGBA')
bone = bone.crop(bone.getchannel('A').getbbox())
for tag, w in (('', 96), ('@2x', 192), ('@3x', 288)):
    h = round(bone.height * w / bone.width)
    save(bone.resize((w, h), Image.LANCZOS), A / 'items' / f'bone{tag}.webp')

# 2) Grab composites (claw sprite 281 frame N) — same crop as existing (1x bbox + 2px pad)
for n in range(2, 15):
    src1 = Image.open(X1 / 'DefineSprite_281' / f'{n}.png').convert('RGBA')
    bb = src1.getchannel('A').getbbox()
    box = (bb[0] - 2, bb[1] - 2, bb[2] + 2, bb[3] + 2)
    cur = Image.open(A / 'hook' / f'grab_{n}.webp')
    want = (box[2] - box[0], box[3] - box[1])
    if (cur.width // 2, cur.height // 2) != want:
        print('skip grab', n, cur.size, want); continue
    hi = Image.open(f'/tmp/gmx6/DefineSprite_281/{n}.png').convert('RGBA')
    hi = hi.crop(tuple(v * 6 for v in box))
    save(hi, A / 'hook' / f'grab_{n}@3x.webp')  # 6x logical, like legacy
    save(hi.resize((want[0] * 4, want[1] * 4), Image.LANCZOS), A / 'hook' / f'grab_{n}@2x.webp')
    # 1x keeps legacy 2× pixel density
    save(hi.resize((want[0] * 2, want[1] * 2), Image.LANCZOS), A / 'hook' / f'grab_{n}.webp')
    print('grab', n, want)

# 3) Mouse walk cycles (271 plain, 275 with diamond) — full sprite-bounds canvas
for sid, name in ((271, 'mouse'), (275, 'mouse_dia')):
    for f in range(1, 8):
        save(Image.open(f'/tmp/gmx3/DefineSprite_{sid}/{f}.png').convert('RGBA'), A / 'items' / 'walk' / f'{name}_{f}.webp')
        save(Image.open(f'/tmp/gmx/DefineSprite_{sid}/{f}.png').convert('RGBA'), A / 'items' / 'walk' / f'{name}_{f}@2x.webp')

# 4) TNT explosion (sprite 253, 14 frames)
for f in range(1, 15):
    for d, tag in (('/tmp/gmx3', ''), ('/tmp/gmx', '@2x')):
        im = Image.open(f'{d}/DefineSprite_253/{f}.png').convert('RGBA')
        save(im, A / 'fx' / 'tnt' / f'boom_{f}{tag}.webp', q=82)
print('done')
