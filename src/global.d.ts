import type { Viewer } from 'cesium';
import 'react';

declare global {
  interface Window {
    geoThreeScene?: { cesiumViewer: Viewer };
  }
}

declare module 'react' {
  interface CSSProperties {
    '--arrow-left'?: string;
    '--lvl-color'?: string;
  }
}
