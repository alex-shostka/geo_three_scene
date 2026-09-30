import type { Viewer } from 'cesium';
import 'react';

declare global {
  interface Window {
    CESIUM_BASE_URL: string;
    geoThreeScene?: { cesiumViewer: Viewer };
  }

  interface ImportMetaEnv {
    readonly VITE_CESIUM_ION_TOKEN?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

declare module 'react' {
  interface CSSProperties {
    '--arrow-left'?: string;
    '--lvl-color'?: string;
  }
}
