'use client';

import { useRef, useState } from 'react';

export function DraggableItem({
  x,
  y,
  onCommit,
  className,
  style,
  children,
}: {
  x: number;
  y: number;
  onCommit: (x: number, y: number) => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState({ x, y });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
  }

  function onPointerUp() {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    onCommit(Math.round(pos.x), Math.round(pos.y));
  }

  return (
    <div
      className={className}
      style={{
        ...style,
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        cursor: dragging ? 'grabbing' : 'grab',
        zIndex: dragging ? 5 : 1,
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {children}
    </div>
  );
}
