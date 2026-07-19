export interface TileBounds {
  west: number;
  east: number;
  south: number;
  north: number;
}

export interface ErrorTileRecord extends TileBounds {
  type: 'error';
  key: string;
  level: number;
  x: number;
  y: number;
  tileUrl: string;
  errorMsg: string;
}

export interface ActiveTileRecord extends TileBounds {
  type: 'active';
  key: string;
  level: number;
  x: number;
  y: number;
  baseColor: number;
}

export type TileRecord = ErrorTileRecord | ActiveTileRecord;

export interface HoveredTile {
  type: TileRecord['type'];
  key: string;
}

export interface FocusBounds {
  centerLon: number;
  centerLat: number;
  span: number;
  tileZ: number;
  /** Z-depth spanned by the currently-rendered levels (see LEVEL_DEPTH); lets
   *  CameraRig start the camera in front of the shallowest level even though
   *  tileZ now targets the deepest one. */
  zRange: number;
  /** True for an explicit user navigation (level-list click) — CameraRig applies
   *  these even after the user has taken manual control of OrbitControls, unlike
   *  the ambient auto-framing updates fired on every Cesium tile load. */
  manual?: boolean;
}

export interface GlbTileInfo extends TileBounds {
  z: number;
  x: number;
  y: number;
  url: string;
}

export type GlbMetadata = Record<string, string | number | (string | number)[]>;

export interface TileCardSection {
  rows: [string, string][];
}
