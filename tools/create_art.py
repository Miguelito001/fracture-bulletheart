from PIL import Image, ImageDraw, ImageFilter
import random,math,os
random.seed(72)
OUT=os.path.join(os.path.dirname(__file__),'..','assets')
os.makedirs(OUT,exist_ok=True)
S=4

def spr(name,paint,w=32,h=40):
 im=Image.new('RGBA',(w,h)); d=ImageDraw.Draw(im)
 paint(d,w,h)
 im=im.resize((w*S,h*S),Image.Resampling.NEAREST)
 im.save(os.path.join(OUT,name+'.png'))

def hero(d,w,h):
 d.ellipse((6,34,26,39), fill=(0,0,0,83))
 d.polygon([(7,16),(25,16),(28,35),(4,35)], fill='#24344c')
 d.polygon([(7,16),(16,22),(25,16),(22,35),(10,35)],fill='#217e99')
 d.polygon([(8,2),(23,2),(28,15),(23,22),(9,21),(4,14)],fill='#142338')
 d.polygon([(11,5),(21,5),(24,13),(21,19),(11,19),(8,13)],fill='#36536b')
 d.rectangle((11,11,21,17),fill='#f1bc87')
 d.rectangle((12,13,14,14),fill='#272d42');d.rectangle((19,13,21,14),fill='#272d42')
 d.line((10,20,9,32), fill='#d9a66c',width=3);d.line((21,20,23,32),fill='#d9a66c',width=3)
 d.rectangle((9,32,14,36),fill='#151c30');d.rectangle((19,32,24,36),fill='#151c30')
 d.polygon([(7,2),(11,0),(20,0),(26,5),(19,4),(11,5)],fill='#4c6881')
 d.point((12,7),fill='#a7e7f3')

def rogue(d,w,h):
 hero(d,w,h);d.polygon([(7,3),(16,0),(25,3),(29,14),(22,9),(9,9),(3,14)],fill='#123746');d.line((10,16,21,16),fill='#43dec3',width=2)

def tank(d,w,h):
 hero(d,w,h);d.rectangle((7,15,25,27),fill='#a7783e');d.rectangle((5,17,10,29),fill='#d5a55c');d.rectangle((22,17,27,29),fill='#d5a55c');d.polygon([(7,3),(25,3),(26,15),(6,15)],fill='#c6b7a2');d.rectangle((11,12,21,15),fill='#20232e')

def mage(d,w,h):
 hero(d,w,h);d.polygon([(7,0),(23,0),(28,20),(5,20)],fill='#594496');d.polygon([(15,0),(21,0),(29,12),(8,10)],fill='#7460b8');d.rectangle((12,13,21,16),fill='#ffd5b1');d.point((14,14),fill='#bbf2ff');d.point((19,14),fill='#bbf2ff')

def enemy(d,w,h,kind):
 d.ellipse((6,34,26,38),fill=(0,0,0,90))
 if kind=='crawler':
  d.ellipse((4,13,28,32),fill='#612b42');d.polygon([(7,15),(2,7),(13,13),(18,13),(30,7),(26,18)],fill='#a94a62');d.ellipse((9,16,22,28),fill='#a34e61');d.rectangle((10,19,13,21),fill='#ffe1a5');d.rectangle((19,19,22,21),fill='#ffe1a5')
  for x in (5,10,20,26): d.line((x,29,x+(x-14)//4,36),fill='#4b273d',width=3)
 elif kind=='ranger':
  d.polygon([(4,4),(26,4),(30,29),(15,34),(2,27)],fill='#345648');d.polygon([(8,8),(24,8),(26,20),(6,20)],fill='#b0bfa0');d.rectangle((10,16,14,19),fill='#3a5248');d.rectangle((19,16,23,19),fill='#3a5248');d.arc((1,10,25,32),90,280,fill='#d6aa71',width=3)
 elif kind=='knight':
  d.polygon([(7,6),(24,6),(28,32),(4,32)],fill='#734b5e');d.rectangle((7,10,25,24),fill='#aaaac0');d.polygon([(6,5),(16,0),(26,5),(23,14),(8,14)],fill='#b9a5c6');d.rectangle((10,11,23,13),fill='#251e37');d.rectangle((13,12,17,14),fill='#ec668d');d.rectangle((3,21,9,32),fill='#5b596f');d.rectangle((25,19,30,30),fill='#5b596f')
 elif kind=='bomber':
  d.ellipse((5,12,27,34),fill='#88624c');d.ellipse((9,7,23,19),fill='#b48a61');d.rectangle((10,17,23,21),fill='#483a34');d.rectangle((11,23,21,29),fill='#ed9f6b');d.point((14,25),fill='#211a26');d.point((19,25),fill='#211a26');d.line((16,9,22,1),fill='#ffd27e',width=2)
 elif kind=='wisp':
  d.ellipse((7,6,26,29),fill='#8374c6');d.ellipse((10,9,22,25),fill='#b0adff');d.ellipse((13,12,20,19),fill='#e4dbff');d.polygon([(9,24),(4,37),(15,29),(22,37),(24,23)],fill='#695caa')
 elif kind=='elite':
  d.polygon([(1,5),(10,14),(16,3),(23,14),(31,5),(26,29),(7,29)],fill='#c79c43');d.polygon([(8,15),(16,8),(25,15),(24,28),(8,28)],fill='#54406b');d.rectangle((10,17,22,20),fill='#e066a0');d.rectangle((11,30,23,36),fill='#35233e')
 elif kind=='boss':
  d.ellipse((1,39,58,49),fill=(0,0,0,100))
  d.polygon([(5,17),(20,9),(35,9),(51,17),(58,41),(3,41)],fill='#6d3859')
  d.polygon([(10,15),(0,2),(20,8),(31,4),(42,8),(60,1),(52,18)],fill='#d88b58')
  d.ellipse((13,12,48,39),fill='#9e5366')
  d.rectangle((17,23,25,27),fill='#fff1b1');d.rectangle((36,23,44,27),fill='#fff1b1')
  d.polygon([(20,32),(28,38),(34,32)],fill='#3c2437')
  d.polygon([(5,18),(1,40),(12,33)],fill='#dc9b6a');d.polygon([(52,17),(58,39),(46,33)],fill='#dc9b6a')

for nm,fn in [('wanderer',hero),('swift',rogue),('bulwark',tank),('arcanist',mage)]:spr(nm,fn)
for nm in ['crawler','ranger','knight','bomber','wisp','elite']:spr(nm,lambda d,w,h,nm=nm:enemy(d,w,h,nm))
spr('boss',lambda d,w,h:enemy(d,w,h,'boss'),64,52)

def tile(name,base,crack,edge,seed):
 r=random.Random(seed); im=Image.new('RGBA',(32,32),base);d=ImageDraw.Draw(im)
 d.line((0,0,31,0),fill=edge);d.line((0,0,0,31),fill=edge)
 d.line((1,31,31,31),fill=crack);d.line((31,1,31,31),fill=crack)
 for _ in range(13):
  x=r.randrange(3,29);y=r.randrange(3,29);color=r.choice([crack,crack,edge]);d.rectangle((x,y,x+r.randrange(1,3),y+r.randrange(1,3)),fill=color)
 for _ in range(2):
  x=r.randrange(6,23);y=r.randrange(6,23)
  d.line((x,y,x+4,y+r.randrange(-2,3),x+7,y+3),fill=crack,width=1)
 im.resize((128,128),Image.Resampling.NEAREST).save(os.path.join(OUT,name+'.png'))
for i in range(5):
 colors=[('#263643','#162530','#40505b'),('#393040','#242338','#57465d'),('#2d3e3d','#1c302f','#52665c'),('#40333d','#30252d','#5f4d58'),('#30364a','#22283a','#5e5d78')][i]
 tile(f'floor{i}',*colors,i+11)

def wall(d,w,h):
 d.rectangle((0,6,31,31),fill='#141f30');d.rectangle((1,5,30,24),fill='#39485b')
 d.rectangle((2,1,30,8),fill='#67768b');d.line((1,8,30,8),fill='#a6adad',width=1)
 d.rectangle((0,24,31,29),fill='#202d3c');d.line((16,9,16,23),fill='#263346',width=2)
 d.line((1,23,30,23),fill='#233043',width=2)
spr('wall',wall,32,32)
def pillar(d,w,h):
 d.ellipse((3,35,29,39),fill=(0,0,0,90));d.rectangle((10,7,23,34),fill='#39495b');d.rectangle((7,3,26,10),fill='#84909b');d.rectangle((5,0,27,5),fill='#566477');d.rectangle((8,30,26,36),fill='#687384');d.rectangle((11,12,13,28),fill='#93a3aa')
spr('pillar',pillar)
def chest(d,w,h):
 d.ellipse((4,30,29,36),fill=(0,0,0,80));d.rectangle((5,14,27,30),fill='#80502f');d.rectangle((7,12,26,16),fill='#bf8544');d.rectangle((6,20,27,23),fill='#d0a05b');d.rectangle((14,17,19,28),fill='#ffe19a');d.rectangle((16,20,18,24),fill='#443a2c')
spr('chest',chest)
def torch(d,w,h):
 d.rectangle((14,15,18,35),fill='#87664c');d.polygon([(16,1),(23,16),(17,23),(10,16)],fill='#e96838');d.polygon([(16,6),(20,15),(16,20),(13,14)],fill='#ffd075');d.rectangle((12,21,20,24),fill='#a9a1a1')
spr('torch',torch)
def altar(d,w,h):
 d.ellipse((1,33,31,39),fill=(0,0,0,80));d.polygon([(7,18),(24,18),(28,34),(4,34)],fill='#5e5178');d.polygon([(16,0),(26,17),(17,26),(6,17)],fill='#9e7be3');d.polygon([(16,4),(22,17),(16,24),(10,17)],fill='#ded0ff');d.point((16,12),fill='white')
spr('altar',altar)
def potion(d,w,h):
 d.rectangle((13,8,21,13),fill='#c4bda5');d.polygon([(12,14),(22,14),(27,24),(24,34),(10,34),(7,25)],fill='#d2e3e1');d.polygon([(10,24),(24,24),(23,32),(12,32)],fill='#e75e83');d.rectangle((13,4,21,8),fill='#956d4b')
spr('potion',potion)
print('created',len(os.listdir(OUT)),'assets')
