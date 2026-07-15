import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { GlbMetadata } from '../types';

/** Reads property values from EXT_structural_metadata binary buffers via gltf.parser. */
export async function parseStructuralMetadata(gltf: GLTF): Promise<GlbMetadata | null> {
  const ext = (gltf.parser.json.extensions as Record<string, any> | undefined)?.EXT_structural_metadata;
  if (!ext?.propertyTables?.length) return null;

  const table = ext.propertyTables[0];
  const classProps = ext.schema?.classes?.[table.class]?.properties;
  if (!classProps) return null;

  const result: GlbMetadata = {};
  const decoder = new TextDecoder();

  for (const [propName, tableEntry] of Object.entries(table.properties) as [string, any][]) {
    const schemaProp = classProps[propName];
    if (!schemaProp) continue;
    try {
      const valuesBV = await gltf.parser.getDependency('bufferView', tableEntry.values);
      if (schemaProp.type === 'STRING') {
        const offsetBV = await gltf.parser.getDependency('bufferView', tableEntry.stringOffsets);
        const offsets = new Uint32Array(offsetBV as ArrayBuffer);
        const bytes = new Uint8Array(valuesBV as ArrayBuffer);
        const strings: string[] = [];
        for (let i = 0; i < table.count; i++) {
          strings.push(decoder.decode(bytes.slice(offsets[i], offsets[i + 1])));
        }
        result[propName] = table.count === 1 ? strings[0] : strings;
      } else if (schemaProp.componentType === 'FLOAT32') {
        const floats = new Float32Array(valuesBV as ArrayBuffer);
        result[propName] = table.count === 1 ? floats[0] : Array.from(floats);
      }
    } catch {
      // skip property on parse error
    }
  }

  return Object.keys(result).length ? result : null;
}
