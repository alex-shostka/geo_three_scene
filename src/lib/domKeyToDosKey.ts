// js-dos's `emulators` package expects its own internal key-code enum (values
// pulled from its bundled player, e.g. KBD_up = 265), not a browser keyCode or a
// PC scancode — this maps the DOM KeyboardEvent.code strings DOOM's default
// controls actually use onto that enum.
export const DOM_KEY_TO_DOS_KEY: Record<string, number> = {
  ArrowUp: 265,
  ArrowDown: 264,
  ArrowLeft: 263,
  ArrowRight: 262,
  KeyW: 87,
  KeyA: 65,
  KeyS: 83,
  KeyD: 68,
  ControlLeft: 341,
  ControlRight: 345,
  ShiftLeft: 340,
  ShiftRight: 344,
  AltLeft: 342,
  AltRight: 346,
  Space: 32,
  Enter: 257,
  Escape: 256,
  Tab: 258,
  Digit0: 48,
  Digit1: 49,
  Digit2: 50,
  Digit3: 51,
  Digit4: 52,
  Digit5: 53,
  Digit6: 54,
  Digit7: 55,
  Digit8: 56,
  Digit9: 57,
};
