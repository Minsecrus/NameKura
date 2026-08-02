import { useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent, RefObject } from "react";
import { HexCard } from "@/components/HexCard";
import { getCanvasSize } from "@/lib/board-layout";
import type { NameCard } from "@/types/name";

type HexBoardProps = {
  viewportRef: RefObject<HTMLDivElement | null>;
  boardStyle: CSSProperties;
  boardMetrics: {
    offset: number;
    overlap: number;
    tileHeight: number;
    tileWidth: number;
  };
  canvasColumns: number;
  isNameLarge: boolean;
  viewportHeight: number;
  viewportWidth: number;
  columns: NameCard[][];
  onCopy: (card: NameCard) => void | Promise<void>;
  onVote: (id: string, delta: "up" | "down") => void;
};

const EDGE_PADDING = 96;

function clampCanvasOffset(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const minX = Math.min(
    EDGE_PADDING,
    viewportWidth - canvasWidth - EDGE_PADDING,
  );
  const maxX =
    canvasWidth + EDGE_PADDING < viewportWidth
      ? (viewportWidth - canvasWidth) / 2
      : EDGE_PADDING;
  const minY = Math.min(
    EDGE_PADDING,
    viewportHeight - canvasHeight - EDGE_PADDING,
  );
  const maxY =
    canvasHeight + EDGE_PADDING < viewportHeight
      ? (viewportHeight - canvasHeight) / 2
      : EDGE_PADDING;

  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  };
}

export function HexBoard({
  viewportRef,
  boardStyle,
  boardMetrics,
  canvasColumns,
  isNameLarge,
  viewportHeight,
  viewportWidth,
  columns,
  onCopy,
  onVote,
}: HexBoardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    originX: number;
    originY: number;
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const movedRef = useRef(false);

  const canvasSize = useMemo(() => {
    return getCanvasSize(
      canvasColumns,
      Math.max(...columns.map((column) => column.length), 0),
      boardMetrics.tileWidth,
      boardMetrics.tileHeight,
      boardMetrics.offset,
      boardMetrics.overlap,
    );
  }, [boardMetrics, canvasColumns, columns]);

  const [dragOffset, setDragOffset] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const offset = clampCanvasOffset(
    dragOffset?.x ?? (viewportWidth - canvasSize.width) / 2,
    dragOffset?.y ?? (viewportHeight - canvasSize.height) / 2,
    viewportWidth,
    viewportHeight,
    canvasSize.width,
    canvasSize.height,
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest("button, input")
    ) {
      return;
    }

    movedRef.current = false;
    dragRef.current = {
      originX: offset.x,
      originY: offset.y,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    if (!movedRef.current && Math.hypot(deltaX, deltaY) > 4) {
      movedRef.current = true;
      setIsDragging(true);
    }

    setDragOffset(
      clampCanvasOffset(
        dragRef.current.originX + deltaX,
        dragRef.current.originY + deltaY,
        viewportWidth,
        viewportHeight,
        canvasSize.width,
        canvasSize.height,
      ),
    );
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }

    window.setTimeout(() => {
      movedRef.current = false;
      setIsDragging(false);
    }, 0);
  };

  return (
    <div
      ref={viewportRef}
      className={`hex-viewport ${isDragging ? "is-dragging" : ""}`}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="hex-canvas"
        style={{
          height: canvasSize.height,
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          width: canvasSize.width,
        }}
      >
        <div className="hex-board" style={boardStyle}>
          {columns.map((column, columnIndex) => (
            <div
              key={`column-${columnIndex}`}
              className={`hex-column ${columnIndex % 2 === 1 ? "hex-column-offset" : ""}`}
            >
              {column.map((card) => (
                <HexCard
                  key={card.id}
                  card={card}
                  isNameLarge={isNameLarge}
                  onCopy={onCopy}
                  onVote={onVote}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
