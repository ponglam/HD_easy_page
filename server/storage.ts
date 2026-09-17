import type { IncomingMessage, ServerResponse } from 'node:http';
import { mkdir,readFile,writeFile,rename,readdir,copyFile } from 'node:fs/promises';
import { resolve,join,extname,basename } from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import { DocumentSchema } from '../src/core/schema';
const projectRoot=resolve(import.meta.dirname,'..');
const jobPattern=/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;
const filePattern=/^[a-f0-9]{64}\.(png|jpg|webp|svg)$/;
const mime:Record<string,string>={'.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
export const dataRoot=resolve(process.env.EASYPAGE_DATA_DIR||join(projectRoot,'user-jobs'));
function failure(message:string,status=400){return Object.assign(new Error(message),{status});}
function send(res:ServerResponse,status:number,value:unknown){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
function sniff(bytes:Buffer){if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png';if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpg';if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')return 'webp';throw failure('只接受 PNG、JPEG 或 WebP 圖片。');}
async function body(req:IncomingMessage,limit=16_000_000){const chunks:Buffer[]=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw failure('檔案過大。',413);chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw failure('無法讀取 JSON。');}}
async function atomic(path:string,data:string|Buffer){const temp=path+'.'+randomUUID()+'.tmp';await writeFile(temp,data);await rename(temp,path);}
async function putAsset(root:string,job:string,bytes:Buffer,extension:string){const name=createHash('sha256').update(bytes).digest('hex')+'.'+extension;const folder=join(root,job,'assets');await mkdir(folder,{recursive:true});await atomic(join(folder,name),bytes);return `/api/jobs/${job}/assets/${name}`;}
function decodeImage(src:string){const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(src);if(!match)throw failure('圖片內容格式錯誤。');const bytes=Buffer.from(match[2],'base64');if(bytes.length>10_000_000)throw failure('圖片超過 10 MB。',413);return {bytes,extension:sniff(bytes)};}
export function createStorageHandler(root=dataRoot){
 return async(req:IncomingMessage,res:ServerResponse):Promise<boolean>=>{
  const pathname=new URL(req.url||'/', 'http://localhost').pathname;if(!pathname.startsWith('/api/'))return false;
  try{
   const origin=req.headers.origin;
   if((origin&&new URL(origin).host!==req.headers.host)||req.headers['sec-fetch-site']==='cross-site')throw failure('不接受跨站請求。',403);
   if(pathname==='/api/health'&&req.method==='GET'){send(res,200,{ok:true,storage:'filesystem'});return true;}
   await mkdir(root,{recursive:true});
   if(pathname==='/api/jobs'&&req.method==='GET'){
    const jobs=[];
    for(const entry of await readdir(root,{withFileTypes:true})){if(!entry.isDirectory()||!jobPattern.test(entry.name))continue;try{const document=DocumentSchema.parse(JSON.parse(await readFile(join(root,entry.name,'document.json'),'utf8')));jobs.push({id:document.id,title:document.title,units:document.units.length});}catch{/* Incomplete uploads do not become documents. */}}
    send(res,200,{jobs});return true;
   }
   const match=/^\/api\/jobs\/([^/]+)(?:\/(document|assets)(?:\/([^/]+))?)?$/.exec(pathname);
   if(!match||!jobPattern.test(match[1]))throw failure('工作路徑無效。',404);
   const [,job,action,file]=match;const folder=join(root,job);
   if(action==='assets'&&file&&req.method==='GET'){
    if(!filePattern.test(file))throw failure('素材路徑無效。',404);
    const bytes=await readFile(join(folder,'assets',file));res.writeHead(200,{'Content-Type':mime[extname(file)],'X-Content-Type-Options':'nosniff','Cache-Control':'private, max-age=31536000, immutable','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; sandbox"});res.end(bytes);return true;
   }
   if(action==='assets'&&!file&&req.method==='POST'){
    const input=await body(req);if(typeof input.dataUrl!=='string')throw failure('缺少圖片。');
    const {bytes,extension}=decodeImage(input.dataUrl);const src=await putAsset(root,job,bytes,extension);
    send(res,201,{src,bytes:bytes.length,originalName:basename(String(input.name||'image')).slice(0,200)});return true;
   }
   if(action==='document'&&!file&&req.method==='GET'){send(res,200,JSON.parse(await readFile(join(folder,'document.json'),'utf8')));return true;}
   if(action==='document'&&!file&&req.method==='PUT'){
    const doc=DocumentSchema.parse(await body(req));if(doc.id!==job)throw failure('文件與工作 ID 不符。');
    for(const asset of Object.values(doc.assets)){
     if(asset.src.startsWith('data:')){const {bytes,extension}=decodeImage(asset.src);asset.src=await putAsset(root,job,bytes,extension);}
     else if(/^\/assets\/[a-zA-Z0-9_.-]+$/.test(asset.src)){
      const extension=extname(asset.src).slice(1);if(!['png','jpg','webp','svg'].includes(extension))continue;
      const bytes=await readFile(join(projectRoot,'public',asset.src));asset.src=await putAsset(root,job,bytes,extension);
     }else if(asset.src.startsWith('/api/jobs/')){
      const reference=/^\/api\/jobs\/([^/]+)\/assets\/([^/]+)$/.exec(asset.src);
      if(!reference||!jobPattern.test(reference[1])||!filePattern.test(reference[2]))throw failure('素材參照無效。');
      const source=join(root,reference[1],'assets',reference[2]);
      if(reference[1]!==job){await mkdir(join(folder,'assets'),{recursive:true});await copyFile(source,join(folder,'assets',reference[2]));asset.src=`/api/jobs/${job}/assets/${reference[2]}`;}else await readFile(source);
     }else if(asset.src!==''&&!/^https:\/\//.test(asset.src))throw failure('不支援的圖片來源。');
    }
    await mkdir(folder,{recursive:true});await atomic(join(folder,'document.json'),JSON.stringify(doc,null,2));
    send(res,200,{document:doc,savedAt:new Date().toISOString(),folder:`user-jobs/${job}`});return true;
   }
   throw failure('找不到此操作。',404);
  }catch(error){const e=error as Error&{status?:number;code?:string};send(res,e.code==='ENOENT'?404:e.status||400,{error:e.code==='ENOENT'?'找不到文件或素材。':e.message});return true;}
 };
}
