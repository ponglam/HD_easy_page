import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {createServer,type Server} from 'node:http';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createStorageHandler} from '../server/storage';
import sample from '../samples/nara-skin.json';
let server:Server,root:string,url:string;
beforeAll(async()=>{root=await mkdtemp(join(tmpdir(),'easypage-storage-test-'));const handler=createStorageHandler(root);server=createServer((req,res)=>{void handler(req,res);});await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();if(!address||typeof address==='string')throw Error();url=`http://127.0.0.1:${address.port}`;});
afterAll(async()=>{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));await rm(root,{recursive:true,force:true});});
describe('Real job-folder storage',()=>{
 it('writes uploaded bytes, saves project assets locally, then reads them back',async()=>{
  const bytes=await readFile('public/assets/nara-serum.png');
  const response=await fetch(url+'/api/jobs/test-job/assets',{method:'POST',body:JSON.stringify({name:'portrait.png',dataUrl:'data:image/png;base64,'+bytes.toString('base64')})});expect(response.status).toBe(201);const uploaded=await response.json();
  expect(uploaded.src).toMatch(/^\/api\/jobs\/test-job\/assets\/[a-f0-9]+.png$/);
  expect(Buffer.from(await(await fetch(url+uploaded.src)).arrayBuffer()).equals(bytes)).toBe(true);
  const document={...structuredClone(sample),id:'test-job'};document.assets.serum.src=uploaded.src;
  const saved=await fetch(url+'/api/jobs/test-job/document',{method:'PUT',body:JSON.stringify(document)});expect(saved.status).toBe(200);
  const disk=JSON.parse(await readFile(join(root,'test-job','document.json'),'utf8'));expect(disk.assets.serum.src).toBe(uploaded.src);expect(disk.assets['portrait-1'].src).toContain('/api/jobs/test-job/assets/');
  expect((await(await fetch(url+'/api/jobs/test-job/document')).json()).id).toBe('test-job');expect((await(await fetch(url+'/api/jobs')).json()).jobs).toContainEqual({id:'test-job',title:sample.title,units:9});
 },30000);
 it('rejects invalid IDs, non-images, cross-site writes and mismatched documents',async()=>{
  expect((await fetch(url+'/api/jobs/%2e%2e%2foutside/assets',{method:'POST',body:'{}'})).status).toBe(404);
  expect((await fetch(url+'/api/jobs/test-job/assets',{method:'POST',body:JSON.stringify({dataUrl:'data:image/png;base64,'+Buffer.from('not a png').toString('base64')})})).status).toBe(400);
  expect((await fetch(url+'/api/jobs/test-job/assets',{method:'POST',headers:{Origin:'https://other.example'},body:'{}'})).status).toBe(403);
  expect((await fetch(url+'/api/jobs/test-job/document',{method:'PUT',body:JSON.stringify(sample)})).status).toBe(400);
 });
});
