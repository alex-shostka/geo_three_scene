import StopwatchIcon from '../assets/icons/stopwatch.svg?react';
import { BENCHMARK_PANEL } from '../constants';
import { PanelToggleButton } from './PanelToggleButton';

export function BenchmarkButton() {
  return (
    <PanelToggleButton id="benchmark-btn" panel={BENCHMARK_PANEL} label="Benchmark">
      <StopwatchIcon aria-hidden="true" />
    </PanelToggleButton>
  );
}
