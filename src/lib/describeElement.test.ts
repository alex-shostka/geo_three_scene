import { describe, expect, it } from 'vitest';
import { describeElement } from './describeElement';

function fakeElement(tagName: string, id = '', classes: string[] = []): Element {
  return { tagName, id, classList: classes } as unknown as Element;
}

describe('describeElement', () => {
  it('prefers the id', () => {
    expect(describeElement(fakeElement('SPAN', 'title', ['fs-label']))).toBe('span#title');
  });

  it('falls back to the first class', () => {
    expect(describeElement(fakeElement('P', '', ['benchmark-text', 'muted']))).toBe('p.benchmark-text');
  });

  it('uses the bare tag when there is nothing else', () => {
    expect(describeElement(fakeElement('CANVAS'))).toBe('canvas');
  });
});
