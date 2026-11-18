import type { WebGLRenderer } from 'three';

let renderer: WebGLRenderer | null = null;

export function setOverlayRenderer(next: WebGLRenderer | null): void {
  renderer = next;
}

export function getOverlayRenderer(): WebGLRenderer | null {
  return renderer;
}
