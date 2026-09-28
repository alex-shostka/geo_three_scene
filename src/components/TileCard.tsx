import { useAppDispatch, useAppSelector } from '../store/hooks';
import { closeTileCard, selectTileCard } from '../store/uiSlice';

export function TileCard() {
  const tileCard = useAppSelector(selectTileCard);
  const dispatch = useAppDispatch();

  return (
    <div id="tile-card" className={tileCard.open ? 'open' : ''}>
      <div id="tile-card-header">
        <span id="tile-card-title">{tileCard.title}</span>
        <button id="tile-card-close" aria-label="Close" onClick={() => dispatch(closeTileCard())}>&times;</button>
      </div>
      <div id="tile-card-body">
        {tileCard.sections.length === 0 && tileCard.message && (
          <span className="tc-empty">{tileCard.message}</span>
        )}
        {tileCard.sections.map((section, i) => (
          <div className="tc-mesh" key={i}>
            <table className="tc-table">
              <tbody>
                {section.rows.map(([k, v], j) => (
                  <tr key={j}>
                    <td className="tc-key">{k}</td>
                    <td className="tc-val">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
