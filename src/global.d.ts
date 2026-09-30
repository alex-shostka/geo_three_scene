import type { Viewer } from 'cesium';
import 'react';

declare global {
  interface Window {
    CESIUM_BASE_URL: string;
    geoThreeScene?: { cesiumViewer: Viewer };
  }
}

declare module 'react' {
  interface CSSProperties {
    '--arrow-left'?: string;
    '--lvl-color'?: string;
  }
}
