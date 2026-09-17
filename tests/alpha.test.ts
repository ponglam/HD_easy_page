import {describe,it,expect} from 'vitest';
import {removeConnectedColor} from '../src/engine/alpha';
describe('Instant Alpha',()=>{
 it('removes only the connected selected color and preserves source pixels',()=>{
  const data=new Uint8ClampedArray([255,255,255,255,0,0,0,255,255,255,255,255]);
  const result=removeConnectedColor(data,3,1,{x:0,y:0},0,0);
  expect(result.color).toBe('#ffffff');expect([...result.pixels.filter((_,i)=>i%4===3)]).toEqual([0,255,255]);expect(data[3]).toBe(255);
 });
 it('feathers similar colors without destroying already transparent pixels',()=>{
  const data=new Uint8ClampedArray([255,255,255,255,230,230,230,255,0,0,0,0]);
  const result=removeConnectedColor(data,3,1,{x:0,y:0},.05,.1);
  expect(result.pixels[7]).toBeGreaterThan(0);expect(result.pixels[7]).toBeLessThan(255);expect(result.pixels[11]).toBe(0);
 });
 it('clamps edge selections and rejects malformed image buffers',()=>{
  expect(removeConnectedColor(new Uint8ClampedArray([1,2,3,255]),1,1,{x:99,y:-1},0,0).pixels[3]).toBe(0);
  expect(()=>removeConnectedColor(new Uint8ClampedArray(3),1,1,{x:0,y:0},0,0)).toThrow();
 });
});
