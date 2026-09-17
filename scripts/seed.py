import json
from pathlib import Path

def write(path,data):
 Path(path).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
colors=dict(paper='#F4F0E8',ink='#373C32',muted='#7B7E70',accent='#7B896E',line='#D2CEC2')
typography={}
for name,size,minimum,leading,family,ink,italic in [('eyebrow',19,16,1.4,'Arial, sans-serif','muted',False),('title',100,48,1.04,'Georgia, serif','ink',False),('body',27,21,1.55,'Arial, sans-serif','ink',False),('caption',18,15,1.5,'Arial, sans-serif','muted',False),('quote',47,28,1.2,'Georgia, serif','accent',True)]:
 typography[name]=dict(family=family,size=size,minSize=minimum,leading=leading,tracking=3 if name=='eyebrow' else 0,color=ink,italic=italic)
tokens=dict(colors=colors,typography=typography)
def slot(id,label,type='text',style=None,required=False):
 return dict(id=id,label=label,semantic=id,type=type,required=required,addable=not required,removable=not required,style=style or ('image' if type=='image' else id),defaultEffects=[])
slots=[slot('eyebrow','章節標記',style='eyebrow'),slot('title','主標題',style='title',required=True),slot('body','內文',style='body',required=True),slot('hero','主視覺','image',required=True),slot('caption','圖片說明',style='caption'),slot('quote','引言',style='quote'),slot('secondary','第二張圖片','image')]
def region(id,frame,ids,scope='page',safe=True,flow='stack'):
 weights={s: {'eyebrow':.4,'title':3,'body':2,'caption':.5,'quote':1.3,'hero':4,'secondary':2}[s] for s in ids}
 return dict(id=id,frame=dict(zip(['x','y','width','height'],frame)),flow=flow,gap=26,scope=scope,gutterSafe=safe,slots=ids,weights=weights)
# Every variant maps all semantic slots; removing optional content reallocates its region.
copy=['eyebrow','title','body','quote']
layouts=[]
specs=[
 ('cover','品牌氛圍開場','single','Rituals for\nnatural radiance.','A quieter approach to everyday skincare. Botanical ingredients, considered textures, and a little space to begin again.','NARA SKIN  /  THE RITUAL COLLECTION','A daily ritual, thoughtfully composed.','serum'),
 ('intro','核心理念','spread','Less noise.\nMore intention.','We believe a daily routine can be an invitation to slow down. NARA brings a thoughtful edit of textures and botanical ingredients to the moments you already make for yourself.','01  /  OUR PHILOSOPHY','Make room for the small things.','botanical'),
 ('story','品牌故事','spread','Rooted in\nthe everyday.','NARA began with one question: what would skincare look like if it asked less of us? Our fictional studio explores fewer steps, familiar ingredients, and packaging designed to live quietly on your shelf.','02  /  OUR STORY','From an idea to a daily companion.','serum'),
 ('product','主打產品','single','The Daily\nBotanical Serum','A lightweight serum concept with a soft, comforting finish. A few drops become the centre of a simple morning ritual. Follow with your everyday moisturiser.','03  /  THE COLLECTION','DAILY BOTANICAL SERUM  /  30 mL','serum'),
 ('feature','成分亮點','spread','Nature, with\na considered touch.','Oat-inspired softness. A green botanical note. A texture that feels quietly luxurious. Each ingredient story in this concept collection begins with how a ritual feels, not how complicated it can become.','04  /  INGREDIENT STORIES','Botanical study No. 01 — leaf, light, texture.','botanical'),
 ('information','使用步驟','single','A moment,\nin three steps.','01  CLEANSE — Begin with a gentle wash.\n02  PAUSE — Press a few drops into your palms.\n03  FINISH — Follow with moisturiser and take a breath.','05  /  YOUR DAILY RITUAL','Illustrative routine for this fictional sample brand.','serum'),
 ('team','品牌人物','spread','A shared eye\nfor the essentials.','Mina Chen, creative direction — shaping the quiet details.\nAlex Lin, product design — finding beauty in simple forms.\nTogether, our fictional team explores how a daily object can feel more personal.','06  /  THE PEOPLE','NARA studio — fictional team portrait placeholder.','portrait'),
 ('gallery','影像故事','spread','A slower\nkind of morning.','Sunlight on stone. A branch against the wall. A familiar bottle within reach. The collection finds its place among ordinary things, and makes a little more room for them.','07  /  IN GOOD COMPANY','An editorial study in light and everyday objects.','serum'),
 ('closing','結語與邀請','single','Make space\nfor your ritual.','Explore the NARA collection and find a rhythm that feels like you.\n\nDiscover the collection → nara.example','NARA SKIN  /  BEGIN AGAIN','A fictional brand. A real space for your story.','serum')]
units=[]
ops=dict(fit='cover',focal=dict(x=.5,y=.5),crop=dict(x=0,y=0,width=1,height=1),backgroundRemove=dict(mode='none',status='idle'))
for idx,(intent,label,kind,title,body,kicker,caption,asset) in enumerate(specs):
 spread=kind=='spread'; left='left' if spread else 'page'; right='right' if spread else 'page'
 a=[region('narrative',[.065,.16,.36,.65],copy,left),region('visual',[.53,.08,.41,.78],['hero','secondary'],right),region('caption',[.53,.88,.40,.055],['caption'],right)]
 b=[region('visual',[.055,.08,.41,.78],['hero','secondary'],left),region('narrative',[.55,.16,.38,.65],copy,right),region('caption',[.055,.88,.4,.055],['caption'],left)]
 if intent=='cover':
  a=[region('narrative',[.065,.16,.45,.70],copy),region('visual',[.57,0,.43,.94],['hero','secondary']),region('caption',[.065,.89,.44,.055],['caption'])]
 if intent in ['story','feature']:
  a=[region('narrative',[.055,.12,.38,.75],copy,'left'),region('visual',[.55,.05,.4,.80],['hero','secondary'],'right'),region('caption',[.55,.88,.4,.055],['caption'],'right')]
 if intent=='gallery':
  a=[region('visual',[.06,.08,.88,.52],['hero','secondary'],'spread',False,'stack'),region('narrative',[.06,.66,.39,.28],['eyebrow','title'],'left'),region('copy',[.55,.66,.39,.28],['body','quote','caption'],'right')]
 if intent=='information':
  a=[region('heading',[.065,.10,.53,.32],['eyebrow','title']),region('copy',[.065,.49,.53,.40],['body','quote','caption']),region('visual',[.65,.16,.29,.72],['hero','secondary'])]
 if intent=='closing':
  a=[region('narrative',[.08,.17,.48,.66],copy),region('visual',[.66,.26,.26,.48],['hero','secondary']),region('caption',[.08,.89,.5,.055],['caption'])]
 layouts.append(dict(id=intent,label=label,intent=intent,kind=kind,description=label+'：以內容目的選擇版型；保留文字與圖片再切換構圖。',slots=slots,variants=[dict(id='editorial',label='Editorial / 編輯敘事',regions=a),dict(id='reverse',label='Image first / 影像優先',regions=b)],gutter=dict(width=0,textSafety=60,imageSafety=40,allowImageCrossing=intent=='gallery')))
 content={k:dict(type='text',text=v,effects=[]) for k,v in dict(eyebrow=kicker,title=title,body=body,caption=caption).items()}
 content['hero']=dict(type='image',assetId=asset,operations=ops,effects=[])
 if intent=='gallery':content['secondary']=dict(type='image',assetId='botanical',operations=ops,effects=[])
 units.append(dict(id=f'unit-{idx+1:02}',label=label,kind=kind,intent=intent,layoutId=intent,variantId='editorial',slots=content))
manifest=dict(id='soft-editorial',name='Soft Editorial / Beauty',version='0.1.0',schemaVersion='0.1',status='ready',description='Warm ivory, muted sage, expressive serif typography, generous whitespace and asymmetrical editorial rhythm.',supportedIntents=[s[0] for s in specs],sampleDocument='samples/nara-skin.json')
write('style-packs/soft-editorial/manifest.json',manifest)
write('style-packs/soft-editorial/pack.json',dict(manifest=manifest,tokens=tokens,layouts=layouts))
for id,name,palette in [('modern-corporate','Modern Corporate Report',dict(paper='#FFFFFF',ink='#153B3D',muted='#658385',accent='#176C72',line='#D5E2E2')),('architectural','Architectural Editorial',dict(paper='#F2F2F0',ink='#161616',muted='#767676',accent='#656565',line='#D0D0CC'))]:
 m=dict(id=id,name=name,version='0.1.0',schemaVersion='0.1',status='planned',description='Reserved M1 manifest. Layout recipes and sample deck to follow.',supportedIntents=['cover','intro','story','product','information','team','gallery','closing'],sampleDocument=None)
 write(f'style-packs/{id}/manifest.json',m)
 write(f'style-packs/{id}/pack.json',dict(manifest=m,tokens=dict(colors=palette,typography=typography),layouts=[]))
assets={}
for id,label,alt,src,w,h,kind in [('serum','NARA / Daily Botanical Serum','Ivory NARA bottle on limestone with a sage branch','/assets/nara-serum.png',1254,1254,'generated'),('botanical','Botanical study / placeholder','Muted sage botanical illustration placeholder','/assets/botanical.svg',900,1100,'placeholder'),('portrait','NARA studio / placeholder','Team portrait placement guide with two abstract figures','/assets/portrait.svg',1200,900,'placeholder')]:
 assets[id]=dict(id=id,label=label,alt=alt,src=src,width=w,height=h,kind=kind,credit='AI-generated concept image' if kind=='generated' else 'Original vector placeholder; replace with licensed photography',artDirection='Soft daylight; warm ivory, stone and muted sage. Quiet editorial composition.')
write('samples/nara-skin.json',dict(schemaVersion='0.1',id='nara-sample',title='NARA — A quieter kind of beauty',stylePackId='soft-editorial',stylePackVersion='0.1.0',page=dict(width=1600,height=900,binding='digital'),units=units,assets=assets))

# Keep the team template as independently editable person portraits.
import runpy
runpy.run_path('scripts/team-portraits.py')
