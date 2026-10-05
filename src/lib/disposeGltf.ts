import { Mesh, Texture, type Material } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

function disposeMaterial(material: Material) {
  Object.values(material).forEach((value) => {
    if (!(value instanceof Texture)) {
      return;
    }

    if (value.image instanceof ImageBitmap) {
      value.image.close();
    }

    value.dispose();
  });

  material.dispose();
}

export function disposeGltf(gltf: GLTF) {
  gltf.scene.traverse((object) => {
    if (!(object instanceof Mesh)) {
      return;
    }

    object.geometry.dispose();

    const materials: Material[] = Array.isArray(object.material) ? object.material : [object.material];

    materials.forEach(disposeMaterial);
  });
}
