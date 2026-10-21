from PIL import Image, ImageDraw,ImageFilter
import math,random,os
random.seed(14)
w,h=640,360
im=Image.new('RGBA',(w,h));pix=im.load()
for y in range(h):
 for x in range(w):
  d=math.hypot((x-w*.5)/w*1.3,(y-h*.47)/h)
  k=max(0,1-d);pix[x,y]=(int(7+k*12),int(10+k*18),int(21+k*30),255)
d=ImageDraw.Draw(im,'RGBA')
# Giant distant door arch and vault
for depth in range(4):
 pad=30+depth*33
 d.polygon([(pad,325),(pad,120+depth*23),(pad+60,90+depth*10),(w-pad-60,90+depth*10),(w-pad,120+depth*23),(w-pad,325)],fill=(31+depth*5,38+depth*5,59+depth*5,90))
 d.line([(pad,325),(pad,120+depth*23),(pad+60,90+depth*10),(w-pad-60,90+depth*10),(w-pad,120+depth*23),(w-pad,325)],fill=(147,119,124,70),width=5)
# Floor in perspective
for i in range(13):
 y=int(230+i*i*0.82)
 if y>359:break
 d.line([(0,y),(w,y)],fill=(150,140,142,int(50+i*5)),width=2)
for x in range(-160,900,130):
 d.line((320+(x-320)*.15,214,x,370),fill=(142,143,151,55),width=2)
# Twin pillars
def pillar(cx):
 d.polygon([(cx-30,83),(cx+30,83),(cx+35,299),(cx-36,299)],fill=(60,68,80,230))
 for y in (82,110,284):d.rectangle((cx-42,y,cx+42,y+13),fill=(91,98,116,255))
 for y in range(122,270,25):d.line((cx-28,y,cx+28,y),fill=(28,37,61,115),width=2)
 d.rectangle((cx-12,105,cx-7,285),fill=(111,119,123,120))
for x in (75,565):pillar(x)
# Blue purple portal
for r in range(105,1,-4):
 alpha=int((1-r/105)*4)+6
 d.ellipse((320-r,210-r*1.12,320+r,210+r*1.12),fill=(90,67,171,alpha))
d.ellipse((250,110,390,290),fill=(34,21,63,255),outline=(144,113,212,190),width=7)
for i in range(9):
 r=53-i*5;d.arc((320-r,200-r*1.1,320+r,200+r*1.1),-30,190,fill=(106+i*12,115+i*10,228,160),width=3)
# torches and glow
for x in (105,535):
 d.rectangle((x-6,174,x+6,218),fill=(92,74,56,255));d.polygon([(x,146),(x+13,170),(x,184),(x-13,170)],fill=(243,124,53,225));d.polygon([(x,153),(x+7,171),(x,177),(x-6,167)],fill=(255,213,111,245))
for _ in range(95):
 x=random.randrange(w);y=random.randrange(90,360);c=(167,133,196,random.randrange(15,70));d.point((x,y),fill=c)
# glow layer
light=Image.new('RGBA',(w,h));l=ImageDraw.Draw(light,'RGBA')
for x in (105,535):
 for r in range(80,3,-3):l.ellipse((x-r,165-r,x+r,165+r),fill=(233,122,51,2))
im=Image.alpha_composite(im,light.filter(ImageFilter.GaussianBlur(9)))
im.convert('RGB').resize((1280,720),Image.Resampling.BILINEAR).save(os.path.join(os.path.dirname(__file__),'..','assets','menu-art.png'))
