const BACKGROUND_COLOR = '#000';
const TEXT_COLOR = '#c0c0c0';
const BAR_COLOR = '#b00000';
const BAR_HEIGHT = 10;

export function drawDoomScreen(ctx: CanvasRenderingContext2D, text: string, progress: number | null) {
  const { width, height } = ctx.canvas;

  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2 - 12);

  if (progress === null) {
    return;
  }

  const barWidth = width * 0.6;
  const barX = (width - barWidth) / 2;
  const barY = height / 2 + 8;

  ctx.strokeStyle = TEXT_COLOR;
  ctx.strokeRect(barX, barY, barWidth, BAR_HEIGHT);
  ctx.fillStyle = BAR_COLOR;
  ctx.fillRect(barX + 2, barY + 2, ((barWidth - 4) * progress) / 100, BAR_HEIGHT - 4);
}
