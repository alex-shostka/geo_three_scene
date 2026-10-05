import type { Object3D } from 'three';

export type UserDataEntry = Record<string, unknown>;

export function collectUserData(root: Object3D): UserDataEntry[] {
  const seen = new Set<string>();
  const result: UserDataEntry[] = [];

  root.traverse((object) => {
    if (!Object.keys(object.userData).length) {
      return;
    }

    const dedupeKey = JSON.stringify(object.userData);

    if (seen.has(dedupeKey)) {
      return;
    }

    seen.add(dedupeKey);
    result.push(object.userData);
  });

  return result;
}
