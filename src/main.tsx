import 'cesium/Build/Cesium/Widgets/widgets.css';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from './App';
import { AppFallback } from './components/AppFallback';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BENCHMARK_PANEL } from './constants';
import { makeStore } from './store';
import { togglePanel } from './store/uiSlice';

const container = document.getElementById('root');

if (!container) {
  throw new Error('#root element not found');
}

const store = makeStore();

if (new URLSearchParams(window.location.search).has('bench')) {
  store.dispatch(togglePanel(BENCHMARK_PANEL));
}

createRoot(container).render(
  <Provider store={store}>
    <ErrorBoundary fallback={(error) => <AppFallback error={error} />}>
      <App />
    </ErrorBoundary>
  </Provider>,
);
