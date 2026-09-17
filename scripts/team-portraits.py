import json
from pathlib import Path
p=Path('style-packs/soft-editorial/pack.json');pack=json.loads(p.read_text());layout=next(l for l in pack['layouts'] if l['id']=='team')
for slot in layout['slots']:
 if slot['id']=='hero':slot.update(label='人物 1 照片',semantic='person-1-portrait')
 if slot['id']=='secondary':slot.update(label='人物 2 照片',semantic='person-2-portrait')
for id,label in [('name1','人物 1 姓名'),('role1','人物 1 職稱'),('name2','人物 2 姓名'),('role2','人物 2 職稱')]:
 if not any(s['id']==id for s in layout['slots']):layout['slots'].append(dict(id=id,label=label,semantic=id,type='text',required=False,addable=True,removable=True,style='body' if id.startswith('name') else 'caption',defaultEffects=[]))
def region(id,x,y,w,h,slots,scope):
 return dict(id=id,frame=dict(x=x,y=y,width=w,height=h),flow='stack',gap=18,scope=scope,gutterSafe=True,slots=slots,weights={s:6 if s in ['hero','secondary'] else .6 if s.startswith('name') else .5 for s in slots})
for variant in layout['variants']:
 imageLeft=variant['id']=='reverse';side='left' if imageLeft else 'right';x=.055 if imageLeft else .54
 narrative=region('narrative',.55 if imageLeft else .055,.16,.38,.65,['eyebrow','title','body','quote'],'right' if imageLeft else 'left')
 narrative['gap']=26;narrative['weights']=dict(eyebrow=.4,title=3,body=2,quote=1.3)
 variant['regions']=[narrative,region('person-1',x,.13,.185,.71,['hero','name1','role1'],side),region('person-2',x+.22,.13,.185,.71,['secondary','name2','role2'],side),region('caption',x,.88,.405,.055,['caption'],side)]
layout['description']='每位成員各有獨立照片、姓名與職稱；可分別換圖、裁切與編輯，不需要預先拼合照片。'
p.write_text(json.dumps(pack,ensure_ascii=False,indent=2)+'\n')
p=Path('samples/nara-skin.json');sample=json.loads(p.read_text());unit=next(u for u in sample['units'] if u['intent']=='team')
for i,name,bg,fg in [(1,'Mina','#ded9ce','#b1a594'),(2,'Alex','#c7cebd','#8c9883')]:
 assetId=f'portrait-{i}';sample['assets'][assetId]=dict(id=assetId,label=f'{name} / portrait placeholder',alt=f'Single portrait placeholder for {name}',src=f'/assets/portrait-{i}.svg',width=600,height=800,kind='placeholder',credit='Original vector placeholder; replace with individual portrait',artDirection='Individual head and shoulders portrait, soft daylight, quiet neutral background.')
 slot='hero' if i==1 else 'secondary';unit['slots'][slot]=dict(type='image',assetId=assetId,operations=dict(fit='cover',focal=dict(x=.5,y=.5),crop=dict(x=0,y=0,width=1,height=1),backgroundRemove=dict(mode='none',status='idle')),effects=[])
 Path(f'public/assets/portrait-{i}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="{bg}"/><circle cx="300" cy="280" r="115" fill="{fg}"/><path d="M50 800Q50 450 300 450Q550 450 550 800Z" fill="{fg}"/><text x="40" y="60" font-family="sans-serif" font-size="14" letter-spacing="3" fill="#626a57">INDIVIDUAL PORTRAIT / {i:02}</text></svg>')
for id,text in [('name1','Mina Chen'),('role1','Creative direction'),('name2','Alex Lin'),('role2','Product design')]:unit['slots'][id]=dict(type='text',text=text,effects=[])
unit['slots']['body']['text']='A shared appreciation for thoughtful details brings our fictional studio together. From creative direction to product design, each person contributes a different way of seeing the everyday.'
unit['slots']['caption']['text']='Two perspectives, one considered collection.'
p.write_text(json.dumps(sample,ensure_ascii=False,indent=2)+'\n')
