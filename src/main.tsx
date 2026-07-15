import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('#root element not found');

// No StrictMode: Cesium's Viewer isn't safe to mount/destroy/remount rapidly
// (WebGL context + worker setup), which is what StrictMode's double-invoked
// effects would do to it in development.
createRoot(container).render(<App />);
