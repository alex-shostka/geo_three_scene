import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { GlbMetadata } from '../types';

interface ClassProperty {
  type: string;
  componentType?: string;
}

interface PropertyTableProperty {
  values: number;
  stringOffsets?: number;
}

interface PropertyTable {
  class: string;
  count: number;
  properties: Record<string, PropertyTableProperty>;
}

interface StructuralMetadataExtension {
  schema?: { classes?: Record<string, { properties?: Record<string, ClassProperty> }> };
  propertyTables?: PropertyTable[];
}

interface GltfExtensions {
  EXT_structural_metadata?: StructuralMetadataExtension;
}

export async function parseStructuralMetadata(gltf: GLTF): Promise<GlbMetadata | null> {
  const extensions: GltfExtensions | undefined = gltf.parser.json.extensions;
  const ext = extensions?.EXT_structural_metadata;

  if (!ext?.propertyTables?.length) {
    return null;
  }

  const table = ext.propertyTables[0];
  const classProps = ext.schema?.classes?.[table.class]?.properties;
  const result: GlbMetadata = {};
  const decoder = new TextDecoder();

  if (!classProps) {
    return null;
  }

  for (const [propName, tableEntry] of Object.entries(table.properties)) {
    const schemaProp = classProps[propName];

    if (!schemaProp) {
      continue;
    }

    try {
      const valuesBV: ArrayBuffer = await gltf.parser.getDependency('bufferView', tableEntry.values);

      if (schemaProp.type === 'STRING' && tableEntry.stringOffsets !== undefined) {
        const offsetBV: ArrayBuffer = await gltf.parser.getDependency('bufferView', tableEntry.stringOffsets);
        const offsets = new Uint32Array(offsetBV);
        const bytes = new Uint8Array(valuesBV);
        const strings: string[] = [];

        for (let i = 0; i < table.count; i++) {
          strings.push(decoder.decode(bytes.slice(offsets[i], offsets[i + 1])));
        }

        result[propName] = table.count === 1 ? strings[0] : strings;
      } else if (schemaProp.componentType === 'FLOAT32') {
        const floats = new Float32Array(valuesBV);

        result[propName] = table.count === 1 ? floats[0] : Array.from(floats);
      }
    } catch {
    }
  }

  return Object.keys(result).length ? result : null;
}
