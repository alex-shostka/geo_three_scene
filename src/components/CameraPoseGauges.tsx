import { InfoTip } from './InfoTip';

export interface CameraPose {
  height: number;
  lon: number;
  lat: number;
  heading: number;
  pitch: number;
  roll: number;
}

const HORIZON_RADIUS = 28;

const HEADING_TIP = 'Direction the camera faces — 0° is north.';
const PITCH_ROLL_TIP = 'Pitch: tilt up/down. Roll: side-to-side lean.';

interface CameraPoseGaugesProps {
  pose: CameraPose | null;
}

export function CameraPoseGauges({ pose }: CameraPoseGaugesProps) {
  const horizonOffset = pose
    ? Math.max(-1, Math.min(1, pose.pitch / 90)) * HORIZON_RADIUS
    : 0;

  return (
    <div id="pose-instruments">
      <div className="gauge-block">
        <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x="32" y="10" textAnchor="middle" className="gauge-tick">N</text>
          <text x="32" y="60" textAnchor="middle" className="gauge-tick">S</text>
          <text x="6" y="35" textAnchor="middle" className="gauge-tick">W</text>
          <text x="58" y="35" textAnchor="middle" className="gauge-tick">E</text>
          <g transform={`rotate(${pose?.heading ?? 0} 32 32)`}>
            <line x1="32" y1="32" x2="32" y2="10" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
            <line x1="32" y1="32" x2="32" y2="46" stroke="#4a5060" strokeWidth="2" strokeLinecap="round" />
          </g>
          <circle cx="32" cy="32" r="2.5" fill="#e8e8ec" />
        </svg>
        <span className="label-row">
          <span className="gauge-label">Heading</span>
          <InfoTip text={HEADING_TIP} />
        </span>
        <span className="gauge-value">{pose ? `${pose.heading.toFixed(1)}°` : '—'}</span>
      </div>

      <div className="gauge-block">
        <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <clipPath id="footer-horizon-clip"><circle cx="32" cy="32" r="28" /></clipPath>
          </defs>
          <g clipPath="url(#footer-horizon-clip)">
            <g transform={`rotate(${pose?.roll ?? 0} 32 32) translate(0 ${horizonOffset})`}>
              <rect x="-10" y="-40" width="104" height="72" fill="#2c4a72" />
              <rect x="-10" y="32" width="104" height="72" fill="#5a4326" />
              <rect x="-10" y="30" width="104" height="4" fill="#e8e8ec" />
            </g>
          </g>
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <line x1="20" y1="32" x2="44" y2="32" stroke="#e8e8ec" strokeWidth="2" />
          <circle cx="32" cy="32" r="1.5" fill="#e8e8ec" />
        </svg>
        <span className="label-row">
          <span className="gauge-label">Pitch / Roll</span>
          <InfoTip text={PITCH_ROLL_TIP} />
        </span>
        <span className="gauge-value">
          {pose ? `${pose.pitch.toFixed(1)}° / ${pose.roll.toFixed(1)}°` : '—'}
        </span>
      </div>

      <div id="pose-coords">
        <div className="footer-stat">
          <span className="fs-label">Lon</span>
          <span className="fs-value">{pose ? `${pose.lon.toFixed(5)}°` : '—'}</span>
        </div>
        <div className="footer-stat">
          <span className="fs-label">Lat</span>
          <span className="fs-value">{pose ? `${pose.lat.toFixed(5)}°` : '—'}</span>
        </div>
      </div>
    </div>
  );
}
