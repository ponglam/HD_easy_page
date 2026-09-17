import { z } from 'zod';
const fraction = z.number().min(0).max(1);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const EffectSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('opacity'), value: fraction }),
  z.object({ type: z.literal('blend'), mode: z.enum(['normal', 'multiply', 'screen', 'overlay', 'soft-light']) }),
  z.object({ type: z.literal('blur'), radius: z.number().min(0).max(40) }),
  z.object({ type: z.literal('shadow'), dx: z.number().min(-100).max(100), dy: z.number().min(-100).max(100), blur: z.number().min(0).max(60), color, opacity: fraction }),
  z.object({ type: z.literal('tint'), color, amount: fraction }),
]);
export const ImageOperationsSchema = z.object({
  fit: z.enum(['cover', 'contain']), focal: z.object({ x: fraction, y: fraction }),
  crop: z.object({ x: fraction, y: fraction, width: z.number().positive().max(1), height: z.number().positive().max(1) }).refine(c => c.x + c.width <= 1.00001 && c.y + c.height <= 1.00001, 'Crop must stay inside source'),
  backgroundRemove: z.object({ mode: z.enum(['none','ai','color-key']), status: z.enum(['idle','pending','ready','failed']), color: color.optional(), threshold: fraction.optional(), feather: z.number().nonnegative().optional(), resultAssetId: z.string().optional() }),
});
export const AssetSchema = z.object({ id: z.string(), label: z.string(), alt: z.string(), src: z.string(), width: z.number().positive(), height: z.number().positive(), kind: z.enum(['generated','placeholder','uploaded','external']), credit: z.string(), artDirection: z.string() });
export const SlotContentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string(), effects: z.array(EffectSchema) }),
  z.object({ type: z.literal('image'), assetId: z.string(), operations: ImageOperationsSchema, effects: z.array(EffectSchema) }),
]);
export const SlotDefinitionSchema = z.object({ id: z.string(), label: z.string(), semantic: z.string(), type: z.enum(['text','image']), required: z.boolean(), addable: z.boolean(), removable: z.boolean(), style: z.enum(['eyebrow','title','body','caption','quote','image']), defaultEffects: z.array(EffectSchema) });
const FrameSchema = z.object({ x: fraction, y: fraction, width: z.number().positive().max(1), height: z.number().positive().max(1) });
export const RegionSchema = z.object({ id: z.string(), frame: FrameSchema, flow: z.enum(['stack','overlay']), gap: z.number().nonnegative(), scope: z.enum(['page','left','right','spread']), gutterSafe: z.boolean(), slots: z.array(z.string()), weights: z.record(z.number().positive()) });
export const LayoutSchema = z.object({ id: z.string(), label: z.string(), intent: z.string(), kind: z.enum(['single','spread']), description: z.string(), slots: z.array(SlotDefinitionSchema), variants: z.array(z.object({ id: z.string(), label: z.string(), regions: z.array(RegionSchema) })).min(1), gutter: z.object({ width: z.number().nonnegative(), textSafety: z.number().nonnegative(), imageSafety: z.number().nonnegative(), allowImageCrossing: z.boolean() }) });
export const TokensSchema = z.object({ colors: z.object({ paper: color, ink: color, muted: color, accent: color, line: color }), typography: z.record(z.object({ family: z.string(), size: z.number().positive(), minSize: z.number().positive(), leading: z.number().positive(), tracking: z.number(), color: z.enum(['ink','muted','accent']), italic: z.boolean() })) });
export const ManifestSchema = z.object({ id: z.string(), name: z.string(), version: z.literal('0.1.0'), schemaVersion: z.literal('0.1'), status: z.enum(['ready','planned']), catalog: z.boolean().default(true), description: z.string(), supportedIntents: z.array(z.string()), sampleDocument: z.string().nullable() });
export const StylePackSchema = z.object({ manifest: ManifestSchema, tokens: TokensSchema, layouts: z.array(LayoutSchema) });
export const UnitSchema = z.object({ id: z.string(), label: z.string(), kind: z.enum(['single','spread']), intent: z.string(), layoutId: z.string(), variantId: z.string(), slots: z.record(SlotContentSchema) });
export const DocumentSchema = z.object({ schemaVersion: z.literal('0.1'), id: z.string(), title: z.string(), stylePackId: z.string(), stylePackVersion: z.literal('0.1.0'), page: z.object({ width: z.number().positive().max(10000), height: z.number().positive().max(10000), binding: z.enum(['digital','saddle-stitch','perfect']) }), units: z.array(UnitSchema).min(1).max(200), assets: z.record(AssetSchema) });
export type Effect = z.infer<typeof EffectSchema>;
export type ImageOperations = z.infer<typeof ImageOperationsSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type SlotContent = z.infer<typeof SlotContentSchema>;
export type Layout = z.infer<typeof LayoutSchema>;
export type StylePack = z.infer<typeof StylePackSchema>;
export type MasterDocument = z.infer<typeof DocumentSchema>;
export type Unit = z.infer<typeof UnitSchema>;
