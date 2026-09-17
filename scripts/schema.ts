import { writeFileSync } from 'node:fs';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { StylePackSchema, DocumentSchema, ManifestSchema } from '../src/core/schema';
for (const [name,schema] of [['style-pack',StylePackSchema],['document',DocumentSchema],['manifest',ManifestSchema]] as const) {
 writeFileSync(`schemas/${name}.v0.1.schema.json`,JSON.stringify(zodToJsonSchema(schema,{name,$refStrategy:'root'}),null,2)+'\n');
}
