import type { MasterDocument } from '../core/schema';
import { validateDocument } from '../core/registry';
export const browserOnly=import.meta.env.VITE_STORAGE_MODE==='browser';
async function request(path:string,options?:RequestInit){let response:Response;try{response=await fetch(path,options);}catch{throw new Error('無法連接工作資料夾服務。仍可繼續編輯，請下載 JSON 備份，或改用獨立示範版。');}if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||'儲存服務無法連線。');}return response.json();}
export async function uploadAsset(jobId:string,dataUrl:string,name:string):Promise<string>{if(browserOnly)return dataUrl;const result=await request(`/api/jobs/${encodeURIComponent(jobId)}/assets`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataUrl,name})});return result.src;}
const queues=new Map<string,Promise<unknown>>();
export function saveJob(doc:MasterDocument):Promise<MasterDocument>{
 if(browserOnly)return Promise.resolve(doc);
 const previous=queues.get(doc.id)||Promise.resolve();
 const next=previous.catch(()=>{}).then(()=>request(`/api/jobs/${encodeURIComponent(doc.id)}/document`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(doc)})).then(result=>validateDocument(result.document));
 queues.set(doc.id,next);return next;
}
export async function listJobs():Promise<{id:string;title:string;units:number}[]>{return browserOnly?[]:(await request('/api/jobs')).jobs;}
export async function loadJob(id:string):Promise<MasterDocument>{return validateDocument(await request(`/api/jobs/${encodeURIComponent(id)}/document`));}
