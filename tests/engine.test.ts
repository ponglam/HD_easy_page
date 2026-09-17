import { describe,expect,it } from 'vitest';
import { pack,packs,sample,validateDocument } from '../src/core/registry';
import { DocumentSchema,ImageOperationsSchema } from '../src/core/schema';
import { reduceDocument,pageLabels } from '../src/core/actions';
import { layoutUnit } from '../src/engine/layout';
import { imageGeometry } from '../src/engine/image';
import { fitText } from '../src/engine/typography';
import { resolveEffects } from '../src/engine/effects';
describe('M1 contracts',()=>{
 it('has a valid nine-unit sample, 18 compatible variants and three available demo themes',()=>{
  expect(validateDocument(sample)).toEqual(sample);expect(sample.units).toHaveLength(9);expect(pack.layouts.flatMap(l=>l.variants)).toHaveLength(18);expect(packs.filter(p=>p.manifest.catalog && p.manifest.status==='ready')).toHaveLength(3);
 });
 it('round trips JSON losslessly',()=>expect(DocumentSchema.parse(JSON.parse(JSON.stringify(sample)))).toEqual(sample));
 it('rejects missing required slots and broken asset references',()=>{
  const copy=structuredClone(sample);delete copy.units[0].slots.title;expect(()=>validateDocument(copy)).toThrow('必要');
  const bad=structuredClone(sample);delete bad.assets.serum;expect(()=>validateDocument(bad)).toThrow('素材');
 });
 it('rejects duplicate units, wrong variants, unsafe source URLs and out of bounds crops',()=>{
  const copy=structuredClone(sample);copy.units[1].id=copy.units[0].id;expect(()=>validateDocument(copy)).toThrow('重複');
  copy.units[1].id='ok';copy.units[0].variantId='unknown';expect(()=>validateDocument(copy)).toThrow('不相容');
  const bad=structuredClone(sample);bad.assets.serum.src='javascript:alert(1)';expect(()=>validateDocument(bad)).toThrow('圖片');
  const hero=sample.units[0].slots.hero;if(hero.type!=='image')throw Error();
  expect(()=>ImageOperationsSchema.parse({...hero.operations,crop:{x:.8,y:0,width:.5,height:1}})).toThrow();
 });
 it('keeps content and image settings across layout changes',()=>{
  const changed=reduceDocument(sample,{type:'variant',unitId:'unit-01',variantId:'reverse'},pack,sample);
  expect(changed.units[0].slots).toEqual(sample.units[0].slots);expect(sample.units[0].variantId).toBe('editorial');
 });
 it('protects required slots and reflows optional slot additions/removals',()=>{
  expect(reduceDocument(sample,{type:'remove-slot',unitId:'unit-01',slotId:'title'},pack,sample).units[0].slots.title).toBeDefined();
  const before=layoutUnit(sample,sample.units[0],pack);
  const changed=reduceDocument(sample,{type:'slot',unitId:'unit-01',slotId:'quote',content:{type:'text',text:'Quietly considered.',effects:[]}},pack,sample);
  const after=layoutUnit(changed,changed.units[0],pack);
  expect(after.elements.find(e=>e.id==='body')!.height).toBeLessThan(before.elements.find(e=>e.id==='body')!.height);
  const removed=reduceDocument(changed,{type:'remove-slot',unitId:'unit-01',slotId:'quote'},pack,sample);
  expect(layoutUnit(removed,removed.units[0],pack)).toEqual(before);
 });
 it('maps every supported slot exactly once per variant, with finite in-bounds geometry',()=>{
  for(const unit of sample.units){const layout=pack.layouts.find(l=>l.id===unit.layoutId)!;
   for(const variant of layout.variants){
    const slots=variant.regions.flatMap(r=>r.slots);expect(new Set(slots).size).toBe(slots.length);expect([...slots].sort()).toEqual(layout.slots.map(s=>s.id).sort());
    const scene=layoutUnit(sample,{...unit,variantId:variant.id},pack);
    expect(scene.warnings).toEqual([]);
    for(const el of scene.elements){expect(el.x).toBeGreaterThanOrEqual(0);expect(el.y).toBeGreaterThanOrEqual(0);expect(el.x+el.width).toBeLessThanOrEqual(scene.width+.01);expect(el.y+el.height).toBeLessThanOrEqual(scene.height+.01);expect(el.height).toBeGreaterThan(0);}
   }
  }
 });
 it('treats spreads as 2W and protects page-bound text while allowing gallery crossing',()=>{
  const gallery=sample.units.find(u=>u.intent==='gallery')!;const scene=layoutUnit(sample,gallery,pack);expect(scene.width).toBe(sample.page.width*2);
  const hero=scene.elements.find(e=>e.id==='hero')!;expect(hero.x).toBeLessThan(scene.width/2);expect(hero.x+hero.width).toBeGreaterThan(scene.width/2);
  for(const el of scene.elements.filter(e=>e.type==='text'))expect(el.x+el.width<=scene.width/2-60||el.x>=scene.width/2+60).toBe(true);
  expect(pageLabels(sample)).toEqual(['01','02–03','04–05','06','07–08','09','10–11','12–13','14']);
 });
 it('adds cloned sample assets and never replaces existing user metadata',()=>{
  const changed=structuredClone(sample);changed.assets.serum.alt='User edited';
  const added=reduceDocument(changed,{type:'add-unit',id:'new',layoutId:'cover'},pack,sample);expect(added.assets.serum.alt).toBe('User edited');expect(added.assets['new-serum']).toBeDefined();expect(validateDocument(added)).toEqual(added);
 });
 it('handles CJK and reports overflow without truncating master content',()=>{
  const text='這是一段需要自動換行的文字'.repeat(100);const fit=fitText(text,200,100,32,16,1.3,0);expect(fit.overflow).toBe(true);expect(fit.fontSize).toBe(16);expect(fit.lines.join('')).toBe(text);
 });
 it('fits cropped sources and responds to focal position',()=>{
  const hero=sample.units[0].slots.hero;if(hero.type!=='image')throw Error();
  const box={x:0,y:0,width:400,height:200};const left=imageGeometry(sample.assets.serum,{...hero.operations,focal:{x:0,y:0}},box);const right=imageGeometry(sample.assets.serum,{...hero.operations,focal:{x:1,y:1}},box);
  expect(left.width).toBe(400);expect(left.y).toBe(0);expect(right.y).toBe(-200);
 });
 it('resolves common effects in fixed order with user overrides',()=>expect(resolveEffects([{type:'opacity',value:.5},{type:'blur',radius:2}],[{type:'opacity',value:.8}])).toEqual([{type:'blur',radius:2},{type:'opacity',value:.8}]));
});
