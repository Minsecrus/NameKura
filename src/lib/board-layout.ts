const HEX_RATIO = 1.8;
export const HEX_GAP = 10;
const MIN_TILE_WIDTH_DESKTOP = 212;
const MIN_TILE_WIDTH_MOBILE = 156;

export function getVisibleColumnCount(width: number) {
  const minTileWidth =
    width < 640 ? MIN_TILE_WIDTH_MOBILE : MIN_TILE_WIDTH_DESKTOP;

  return Math.max(1, Math.floor((width + HEX_GAP) / (minTileWidth + HEX_GAP)));
}

export function getCanvasColumnCount(width: number) {
  const visibleColumns = getVisibleColumnCount(width);
  return visibleColumns + (width < 640 ? 2 : 4);
}

export function getBoardMetrics(viewportWidth: number, visibleColumns: number) {
  const boardWidth = Math.min(viewportWidth - 32, 1600);
  const tileWidth = Math.max(
    128,
    (boardWidth - Math.max(0, visibleColumns - 1) * HEX_GAP) /
      Math.max(1, visibleColumns * 0.88 + 0.12),
  );
  const tileHeight = tileWidth / HEX_RATIO;
  const offset = (tileHeight + HEX_GAP) / 2;
  const overlap = Math.max(0, tileWidth * 0.12 - HEX_GAP);

  return {
    offset,
    overlap,
    tileHeight,
    tileWidth,
  };
}

export function getCanvasSize(
  canvasColumns: number,
  maxRows: number,
  tileWidth: number,
  tileHeight: number,
  offset: number,
  overlap: number,
) {
  const width =
    canvasColumns > 0
      ? canvasColumns * tileWidth - Math.max(0, canvasColumns - 1) * overlap
      : tileWidth;
  const height =
    maxRows > 0
      ? maxRows * tileHeight + Math.max(0, maxRows - 1) * HEX_GAP + offset
      : tileHeight;

  return { width, height };
}
