import { useLayoutEffect, useRef, useState } from 'react';
import { useUi } from '../state/UiContext';

export function TileTooltip() {
  const { tooltip } = useUi();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!tooltip || !ref.current) return;
    const offset = 16;
    const tw = ref.current.offsetWidth;
    const th = ref.current.offsetHeight;
    let x = tooltip.x + offset;
    let y = tooltip.y + offset;
    if (x + tw > window.innerWidth - 8) x = tooltip.x - tw - offset;
    if (y + th > window.innerHeight - 8) y = tooltip.y - th - offset;
    setPos({ left: x, top: y });
  }, [tooltip]);

  if (!tooltip) return <div id="tile-tooltip" ref={ref} />;

  const { record } = tooltip;
  const widthKm = (record.east - record.west) * 111 * Math.cos(((record.south + record.north) / 2) * Math.PI / 180);
  const heightKm = (record.north - record.south) * 111;
  const centerLon = ((record.west + record.east) / 2).toFixed(4);
  const centerLat = ((record.south + record.north) / 2).toFixed(4);

  return (
    <div id="tile-tooltip" ref={ref} style={{ display: 'block', left: pos.left, top: pos.top }}>
      <span className="tt-path">/{record.level}/{record.x}/{record.y}</span>{'\n'}
      <span className="tt-label">url   </span><span className="tt-url">{record.tileUrl}</span>{'\n'}
      <span className="tt-label">error </span><span className="tt-error">{record.errorMsg}</span>{'\n'}
      <span className="tt-label">lon   </span>
      <span className="tt-value">{record.west.toFixed(4)}° … {record.east.toFixed(4)}°  (center {centerLon}°)</span>{'\n'}
      <span className="tt-label">lat   </span>
      <span className="tt-value">{record.south.toFixed(4)}° … {record.north.toFixed(4)}°  (center {centerLat}°)</span>{'\n'}
      <span className="tt-label">size  </span><span className="tt-value">{widthKm.toFixed(1)} × {heightKm.toFixed(1)} km</span>{'\n'}
      <span className="tt-label">zoom  </span><span className="tt-value">{record.level}</span>
    </div>
  );
}
