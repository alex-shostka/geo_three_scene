export const LOCAL_TILES_URL_TEMPLATE = '/tiles/{z}/{x}/{y}.png';
export const GLB_TILES_URL_TEMPLATE = '/tiles_glb_meta_ext/{z}/{x}/{y}.glb';

export function buildTileUrl(template: string, level: number, x: number, y: number): string {
  return template.replace('{z}', String(level)).replace('{x}', String(x)).replace('{y}', String(y));
}
