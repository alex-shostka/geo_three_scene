export interface DrawCallCount {
  drawCalls: number;
  triangles: number;
}

export interface RecordedDrawCalls extends DrawCallCount {
  largestCall: number;
}

type GlContext = WebGLRenderingContext | WebGL2RenderingContext;

const TRIANGLES = 0x0004;
const TRIANGLE_STRIP = 0x0005;
const TRIANGLE_FAN = 0x0006;

export function trianglesFor(mode: number, count: number, instances = 1): number {
  if (mode === TRIANGLES) {
    return Math.floor(count / 3) * instances;
  }

  if (mode === TRIANGLE_STRIP || mode === TRIANGLE_FAN) {
    return Math.max(count - 2, 0) * instances;
  }

  return 0;
}

export function recordDrawCalls(gl: GlContext): { count: RecordedDrawCalls; stop: () => void } {
  const count: RecordedDrawCalls = { drawCalls: 0, triangles: 0, largestCall: 0 };
  const target = gl as unknown as Record<string, unknown>;
  const restores: (() => void)[] = [];

  const patch = (name: string, countOf: (args: number[]) => { mode: number; count: number; instances: number }) => {
    const original = target[name];

    if (typeof original !== 'function') {
      return;
    }

    const ownProperty = Object.prototype.hasOwnProperty.call(target, name);

    target[name] = (...args: number[]) => {
      const call = countOf(args);
      const triangles = trianglesFor(call.mode, call.count, call.instances);

      count.drawCalls += 1;
      count.triangles += triangles;
      count.largestCall = Math.max(count.largestCall, triangles);

      return original.apply(gl, args);
    };
    restores.push(() => {
      if (ownProperty) {
        target[name] = original;

        return;
      }

      delete target[name];
    });
  };

  patch('drawArrays', ([mode = 0, , vertices = 0]) => ({ mode, count: vertices, instances: 1 }));
  patch('drawElements', ([mode = 0, indices = 0]) => ({ mode, count: indices, instances: 1 }));
  patch('drawArraysInstanced', ([mode = 0, , vertices = 0, instances = 1]) => ({ mode, count: vertices, instances }));
  patch('drawElementsInstanced', ([mode = 0, indices = 0, , , instances = 1]) => ({
    mode,
    count: indices,
    instances,
  }));

  return {
    count,
    stop: () => {
      restores.forEach((restore) => restore());
    },
  };
}
