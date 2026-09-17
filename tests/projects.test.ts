import {describe,it,expect} from 'vitest';
import {pack,sample,validateDocument} from '../src/core/registry';
import {createProject} from '../src/core/projects';
import {reduceDocument,pageLabels} from '../src/core/actions';
import {layoutUnit} from '../src/engine/layout';
describe('Style library and personal pagination',()=>{
 it('builds exactly the selected sequence, including repeated templates and chosen variants',()=>{
  const doc=createProject(sample,[{id:'a',layoutId:'cover',variantId:'editorial'},{id:'b',layoutId:'product',variantId:'reverse'},{id:'c',layoutId:'product',variantId:'editorial'},{id:'d',layoutId:'team',variantId:'editorial'}],'My catalog','my-catalog');
  expect(validateDocument(doc)).toEqual(doc);expect(doc.units.map(u=>u.layoutId)).toEqual(['cover','product','product','team']);expect(pageLabels(doc)).toEqual(['01','02','03','04–05']);expect(doc.title).toBe('My catalog');
  const a=doc.units[1].slots.hero,b=doc.units[2].slots.hero;if(a.type!=='image'||b.type!=='image')throw Error();expect(a.assetId).not.toBe(b.assetId);
  doc.units[1].slots.title={type:'text',text:'Only this product',effects:[]};expect(doc.units[2].slots.title).not.toEqual(doc.units[1].slots.title);
 });
 it('does not permit an empty project or duplicate instance IDs',()=>{
  expect(()=>createProject(sample,[],'','x')).toThrow();expect(()=>createProject(sample,[{id:'a',layoutId:'cover',variantId:'editorial'},{id:'a',layoutId:'cover',variantId:'editorial'}],'','x')).toThrow();
 });
 it('inserts after the selected page and duplicates edited content with independent assets',()=>{
  const doc=structuredClone(sample);doc.units[0].slots.title={type:'text',text:'Edited cover',effects:[]};
  const inserted=reduceDocument(doc,{type:'add-unit',id:'new-product',layoutId:'product',variantId:'reverse',afterId:doc.units[0].id},pack,sample);
  expect(inserted.units[1].id).toBe('new-product');expect(inserted.units[1].variantId).toBe('reverse');
  const duplicate=reduceDocument(inserted,{type:'duplicate-unit',unitId:doc.units[0].id,id:'copy'},pack,sample);
  expect(duplicate.units[1].slots.title).toEqual(doc.units[0].slots.title);
  const original=duplicate.units[0].slots.hero,copied=duplicate.units[1].slots.hero;if(original.type!=='image'||copied.type!=='image')throw Error();expect(original.assetId).not.toBe(copied.assetId);expect(validateDocument(duplicate)).toEqual(duplicate);
 });
 it('renders two independently editable team portraits with individual names and roles',()=>{
  const team=sample.units.find(u=>u.layoutId==='team')!;
  const first=team.slots.hero,second=team.slots.secondary;if(first.type!=='image'||second.type!=='image')throw Error();expect(first.assetId).not.toBe(second.assetId);
  for(const variant of pack.layouts.find(l=>l.id==='team')!.variants){const scene=layoutUnit(sample,{...team,variantId:variant.id},pack);const a=scene.elements.find(e=>e.id==='hero')!,b=scene.elements.find(e=>e.id==='secondary')!;expect(a.x+a.width).toBeLessThan(b.x);expect(scene.elements.filter(e=>e.type==='image')).toHaveLength(2);expect(scene.warnings).toEqual([]);}
  expect(team.slots.name1.type).toBe('text');expect(team.slots.role2.type).toBe('text');
 });
 it('upgrades only the old stock composite portrait, preserving user images and copy',()=>{
  const legacy=structuredClone(sample),team=legacy.units.find(u=>u.layoutId==='team')!;
  team.slots.hero={...team.slots.hero,type:'image',assetId:'portrait'} as typeof team.slots.hero;delete team.slots.secondary;delete team.slots.name1;
  team.slots.body={type:'text',text:'My edited story',effects:[]};
  const upgraded=validateDocument(legacy).units.find(u=>u.id===team.id)!;
  expect(upgraded.slots.secondary).toBeDefined();expect(upgraded.slots.name1).toBeDefined();expect(upgraded.slots.body).toEqual(team.slots.body);
  legacy.assets.portrait.src='https://example.com/my-portrait.jpg';legacy.assets.portrait.kind='external';
  expect(validateDocument(legacy).units.find(u=>u.id===team.id)!.slots.secondary).toBeUndefined();
 });
});
