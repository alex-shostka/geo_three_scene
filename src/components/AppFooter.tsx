import ChevronUpIcon from '../assets/icons/chevron-up.svg?react';
import { useCameraPose } from '../cesium/useCameraPose';
import { EMPTY_VALUE } from '../constants';
import { LEVEL_DEPTH } from '../lib/tileGeometry';
import { useAppSelector } from '../store/hooks';
import { selectErrorCount, selectFocusBounds } from '../store/tilesSlice';
import { CameraPoseGauges } from './CameraPoseGauges';
import { Footer } from './Footer';
import { InfoTip } from './InfoTip';
import { Stat } from './ui/Stat';

const HEIGHT_TIP = 'Camera altitude above the ground.';
const LOD_TIP = 'Tile detail level — higher means more zoomed in.';

export function AppFooter() {
  const pose = useCameraPose();
  const errorCount = useAppSelector(selectErrorCount);
  const focusBounds = useAppSelector(selectFocusBounds);
  const lod = focusBounds ? Math.round(-focusBounds.tileZ / LEVEL_DEPTH) : null;

  return (
    <Footer>
      <Footer.Bar>
        <div id="camera-info">
          <Stat>
            <Stat.Heading>
              <InfoTip text={HEIGHT_TIP} />
              <Stat.Label>Height</Stat.Label>
            </Stat.Heading>
            <Stat.Value>{pose ? `${Math.round(pose.height).toLocaleString()} m` : EMPTY_VALUE}</Stat.Value>
          </Stat>
          <Stat>
            <Stat.Heading>
              <InfoTip text={LOD_TIP} />
              <Stat.Label>LOD</Stat.Label>
            </Stat.Heading>
            <Stat.Value>{lod ?? EMPTY_VALUE}</Stat.Value>
          </Stat>
        </div>
        <div id="tile-hud" className={errorCount > 0 ? 'has-errors' : ''}>
          <span className="fs-icon">⚠</span>
          <span className="fs-value">{errorCount}</span>
          <span className="fs-label">error tiles</span>
        </div>

        <Footer.Toggle>
          <ChevronUpIcon aria-hidden="true" />
        </Footer.Toggle>
      </Footer.Bar>
      <Footer.Content>
        <CameraPoseGauges pose={pose} />
      </Footer.Content>
    </Footer>
  );
}
