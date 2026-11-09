#!/usr/bin/env python3
"""Re-render remaining raster assets from SWF vectors with registration locked to the old files.

Renders: ffdec-cli -format sprite:png|shape:png|button:png|frame:png -zoom Z -selectid ID -export ... /tmp/hd/z{Z}
  (Z = k*m: k = old 1x density vs SWF px, m = 1/2/3 tier). Each tier is cropped from the render at the integer
  offset that best matches the old file of that tier (SSD search around the bbox-centre guess), so canvas
  size + registration are unchanged. Skull = tight crop of sprite 323 @zoom12 (old file was corrupted).
  shop/next @2x/@3x = vector button 78 + white label lifted from the old tier (label is not a SWF glyph).
"""
from PIL import Image
from pathlib import Path
A=Path('/workspace/gold-miner/assets'); H=Path('/tmp/hd')
SP=lambda i,f=1:f'DefineSprite_{i}/{f}.png'
spec={}
spec['fx/dyn_boom']=(SP(255,3),1); spec['fx/dyn_stick']=(SP(250),1)
spec['hook/open']=(SP(281),2); spec['hook/closed']=(SP(281),2)
spec['hook/grab_10']=(SP(281,10),2); spec['hook/grab_11']=(SP(281,11),2)
for k,i in dict(bag=200,diamond_m=318,diamond_s=278,gold_l=314,gold_m=203,gold_xl=196,tnt=330,pig=317).items(): spec['items/'+k]=(SP(i),3)
for k,i in dict(gold_s=2,rock_l=207,rock_m=204).items(): spec['items/'+k]=(f'{i}.png',3)
mm=json.load(open('/workspace/gm-hd/match.json'))
for k,v in mm.items():
    if k.startswith('miner/'):
        spec[k[:-5]]=(SP(238,int(Path(v[0][1]).stem)),1)
for k,i in dict(clover=111,dia=105,dyn=88,rock=116).items(): spec['shop/'+k]=(SP(i,2),2)
spec['shop/str']=('118.png',2); spec['shop/next']=(SP(138,13),1)
spec['ui/title_screen']=('13.png',1)
only=sys.argv[1:]
HINT={}
def pm(im):
    a=np.asarray(im.convert('RGBA'),dtype=np.float32)/255; return np.concatenate([a[...,:3]*a[...,3:],a[...,3:]],2)
def crop(R,x,y,W,Hh):
    out=Image.new('RGBA',(W,Hh),(0,0,0,0)); out.paste(R.crop((x,y,x+W,y+Hh)),(0,0)); return out
report={}
for key,(rel,k) in spec.items():
    if only and not any(o in key for o in only): continue
    res=[]
    for m,tag in ((1,''),(2,'@2x'),(3,'@3x')):
        z=k*m
        if not (H/f'z{z}'/rel).exists(): continue
        R=Image.open(H/f'z{z}'/rel).convert('RGBA')
        old=Image.open(A/(key+tag+'.webp')).convert('RGBA'); W,Hh=old.size
        if R.getchannel('A').getextrema()[0]==255 and R.size==old.size:
            best=(0,0,0)
        else:
            ob=old.getchannel('A').getbbox(); rb=R.getchannel('A').getbbox()
            px,py=rb[0]-ob[0], rb[1]-ob[1]
            # align by bbox centre instead (robust to edge softness)
            px=round((rb[0]+rb[2])/2-(ob[0]+ob[2])/2); py=round((rb[1]+rb[3])/2-(ob[1]+ob[3])/2)
            if key in HINT: px,py=HINT[key][0]*m,HINT[key][1]*m
            T=pm(old); best=None; s=m+3
            for dy in range(-s,s+1):
                for dx in range(-s,s+1):
                    C=pm(crop(R,px+dx,py+dy,W,Hh)); e=float(((C-T)**2).mean())
                    if best is None or e<best[0]: best=(e,px+dx,py+dy)
        new=crop(R,best[1],best[2],W,Hh)
        e=float(np.sqrt(((pm(new)-pm(old))**2).mean()))
        res.append((tag or '1x',(best[1]/m,best[2]/m),round(e,4)))
        new.save(A/(key+tag+'.webp'),'WEBP',quality=90 if m<3 or W*Hh<1e6 else 88,method=6)
    report[key]=res
    print(key, res, flush=True)
json.dump(report,open('/workspace/gm-hd/regen_report.json','w'),indent=1)
