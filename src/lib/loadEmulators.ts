// emulators.js only ships as a browser <script> global (see js-dos.com/browser.html),
// so it's loaded from their CDN at runtime rather than bundled as an npm dependency.
const EMULATORS_SCRIPT_URL = 'https://v8.js-dos.com/latest/emulators/emulators.js';
const EMULATORS_PATH_PREFIX = 'https://v8.js-dos.com/latest/emulators/';

export interface CommandInterfaceEvents {
  onFrameSize: (consumer: (width: number, height: number) => void) => void;
  onFrame: (consumer: (rgb: Uint8Array | null, rgba: Uint8Array | null) => void) => void;
}

export interface CommandInterface {
  events: () => CommandInterfaceEvents;
  exit: () => Promise<void>;
  sendKeyEvent: (keyCode: number, pressed: boolean) => void;
}

export interface EmulatorsGlobal {
  pathPrefix: string;
  dosboxWorker: (bytes: Uint8Array) => Promise<CommandInterface>;
}

declare global {
  interface Window {
    emulators?: EmulatorsGlobal;
  }
}

let emulatorsScriptPromise: Promise<EmulatorsGlobal> | null = null;

export function loadEmulators(): Promise<EmulatorsGlobal> {
  if (window.emulators) return Promise.resolve(window.emulators);
  if (!emulatorsScriptPromise) {
    emulatorsScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = EMULATORS_SCRIPT_URL;
      script.onload = () => {
        if (!window.emulators) {
          reject(new Error('emulators global missing after script load'));
          return;
        }
        window.emulators.pathPrefix = EMULATORS_PATH_PREFIX;
        resolve(window.emulators);
      };
      script.onerror = () => reject(new Error('failed to load emulators.js'));
      document.head.appendChild(script);
    });
  }
  return emulatorsScriptPromise;
}
