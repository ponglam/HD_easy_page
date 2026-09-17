import type { MasterDocument } from '../core/schema';
import type { Scene } from '../engine/layout';
export interface ExportAdapter { format: 'pdf'|'idml'; export(document:MasterDocument,scenes:Scene[]):Promise<Blob> }
export const futureExportAdapters:ExportAdapter[] = ['pdf','idml'].map(format=>({format:format as 'pdf'|'idml',async export(){throw new Error(`${format.toUpperCase()} export is a reserved M2 interface.`);}}));
export function downloadJson(doc:MasterDocument) {
 const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='easypage-document.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
