import type { Asset, ImageOperations, MasterDocument } from '../core/schema';
export interface Box { x:number; y:number; width:number; height:number }
export function imageGeometry(asset: Asset, op: ImageOperations, box: Box): Box {
 const crop = op.crop; const cw = asset.width * crop.width; const ch = asset.height * crop.height;
 const scale = op.fit === 'cover' ? Math.max(box.width/cw,box.height/ch) : Math.min(box.width/cw,box.height/ch);
 const w = cw*scale; const h = ch*scale;
 const alignX = op.fit === 'contain' ? .5 : op.focal.x; const alignY = op.fit === 'contain' ? .5 : op.focal.y;
 return { x:box.x+(box.width-w)*alignX-crop.x*asset.width*scale, y:box.y+(box.height-h)*alignY-crop.y*asset.height*scale,width:asset.width*scale,height:asset.height*scale };
}
export function resolveProcessedAsset(doc: MasterDocument, assetId: string, operations: ImageOperations): Asset {
 const result = operations.backgroundRemove;
 return result.status === 'ready' && result.resultAssetId && doc.assets[result.resultAssetId] ? doc.assets[result.resultAssetId] : doc.assets[assetId];
}
export interface BackgroundRemovalProvider { remove(asset: Asset, operation: ImageOperations['backgroundRemove']): Promise<Asset> }
export const backgroundRemovalStub: BackgroundRemovalProvider = { async remove() { throw new Error('Background removal provider is not installed. M1 stores the operation only.'); } };
