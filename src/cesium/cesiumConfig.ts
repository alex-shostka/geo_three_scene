import { Ion, UrlTemplateImageryProvider } from 'cesium';

window.CESIUM_BASE_URL = '/cesium';
Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2ZDg4NGM2Yy04ZGI2LTRiMmQtODYzMi0zN2FiNjk2OGZhNTUiLCJpZCI6MjQ3OTkxLCJpYXQiOjE3Mjg4OTk4NDR9.BCXMjcfaozkXi39xo656RKTNAYKHrgw3ARreKCN9i4A';

export const AMSTERDAM = { lon: 4.9041, lat: 52.3676 };
export const HOME_HEIGHT = 50000;

export function createLocalTilesProvider(): UrlTemplateImageryProvider {
  return new UrlTemplateImageryProvider({
    url: '/tiles/{z}/{x}/{y}.png',
    minimumLevel: 0,
    maximumLevel: 15,
    credit: 'OpenStreetMap contributors',
  });
}
