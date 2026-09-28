import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Provider } from 'react-redux';
import { makeStore } from './store';

const container = document.getElementById('root');
if (!container) throw new Error('#root element not found');

// No StrictMode: Cesium's Viewer isn't safe to mount/destroy/remount rapidly
// (WebGL context + worker setup), which is what StrictMode's double-invoked
// effects would do to it in development.

const store = makeStore();

createRoot(container).render(
    <Provider store={store}>
        <App />
    </Provider>
);
