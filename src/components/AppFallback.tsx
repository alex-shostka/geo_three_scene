import { isWebGLAvailable } from '../lib/isWebGLAvailable';

interface AppFallbackProps {
  error: Error;
}

export function AppFallback({ error }: AppFallbackProps) {
  const webGLAvailable = isWebGLAvailable();

  return (
    <div id="app-fallback" role="alert">
      <h1 className="af-title">{webGLAvailable ? 'Something went wrong' : 'WebGL is not available'}</h1>
      <p className="af-text">
        {webGLAvailable
          ? error.message
          : 'This app renders a 3D globe and needs WebGL. Turn on hardware acceleration in the browser settings or open the page in a recent Chrome, Firefox or Safari.'}
      </p>
      <button className="af-reload" onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  );
}
