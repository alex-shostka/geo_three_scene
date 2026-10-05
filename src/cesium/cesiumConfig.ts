import { UrlTemplateImageryProvider } from 'cesium';
import { LOCAL_TILES_URL_TEMPLATE } from '../lib/tileUrl';

export const AMSTERDAM = { lon: 4.9041, lat: 52.3676 };
export const HOME_HEIGHT = 50000;

export function createLocalTilesProvider(): UrlTemplateImageryProvider {
  return new UrlTemplateImageryProvider({
    url: LOCAL_TILES_URL_TEMPLATE,
    minimumLevel: 0,
    maximumLevel: 15,
    credit: 'OpenStreetMap contributors',
  });
}
