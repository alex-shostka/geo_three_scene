import { describe, expect, it } from 'vitest';
import { recordDrawCalls, trianglesFor } from './countDrawCalls';

const TRIANGLES = 0x0004;
const TRIANGLE_STRIP = 0x0005;
const TRIANGLE_FAN = 0x0006;
const LINES = 0x0001;
const POINTS = 0x0000;

class FakeContext {
  drawn: number[][] = [];

  drawArrays(...args: number[]) {
    this.drawn.push(args);
  }

  drawElements(...args: number[]) {
    this.drawn.push(args);
  }

  drawElementsInstanced(...args: number[]) {
    this.drawn.push(args);
  }
}

describe('trianglesFor', () => {
  it('counts triangles by primitive type', () => {
    expect(trianglesFor(TRIANGLES, 300)).toBe(100);
    expect(trianglesFor(TRIANGLE_STRIP, 300)).toBe(298);
    expect(trianglesFor(TRIANGLE_FAN, 4)).toBe(2);
  });

  it('does not count lines and points as triangles', () => {
    expect(trianglesFor(LINES, 300)).toBe(0);
    expect(trianglesFor(POINTS, 300)).toBe(0);
  });

  it('multiplies by the number of instances', () => {
    expect(trianglesFor(TRIANGLES, 6, 10)).toBe(20);
  });
});

describe('recordDrawCalls', () => {
  it('counts draw calls and triangles while recording and still draws', () => {
    const gl = new FakeContext();
    const recording = recordDrawCalls(gl as unknown as WebGL2RenderingContext);

    gl.drawElements(TRIANGLES, 600, 0x1403, 0);
    gl.drawArrays(TRIANGLE_STRIP, 0, 4);
    gl.drawArrays(LINES, 0, 100);
    gl.drawElementsInstanced(TRIANGLES, 3, 0x1403, 0, 5);

    expect(recording.count).toEqual({ drawCalls: 4, triangles: 207, largestCall: 200 });
    expect(gl.drawn).toHaveLength(4);
  });

  it('stops counting and restores the original methods', () => {
    const gl = new FakeContext();
    const recording = recordDrawCalls(gl as unknown as WebGL2RenderingContext);

    recording.stop();
    gl.drawArrays(TRIANGLES, 0, 3);

    expect(recording.count).toEqual({ drawCalls: 0, triangles: 0, largestCall: 0 });
    expect(Object.prototype.hasOwnProperty.call(gl, 'drawArrays')).toBe(false);
  });
});
