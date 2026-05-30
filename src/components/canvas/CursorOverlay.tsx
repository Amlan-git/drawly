'use client';

import React from 'react';
import type { Collaborator } from '@/hooks/useRoom';

interface CursorOverlayProps {
  collaborators: Collaborator[];
  // Direct ref to the Excalidraw API — read scroll/zoom without causing RoomCanvas re-renders
  excalidrawRef: React.RefObject<any>;
}

const HEADER_HEIGHT = 56;

/**
 * Convert Excalidraw canvas coordinates to CSS screen coordinates.
 * screenX = canvasX * zoom + scrollX
 * Add header offset so overlay sits below the fixed header.
 */
function toScreen(
  cx: number,
  cy: number,
  scrollX: number,
  scrollY: number,
  zoom: number
) {
  return {
    x: cx * zoom + scrollX,
    y: cy * zoom + scrollY + HEADER_HEIGHT,
  };
}

export default function CursorOverlay({ collaborators, excalidrawRef }: CursorOverlayProps) {
  // Read scroll/zoom directly from Excalidraw at render time — no state needed
  const appState = excalidrawRef.current?.getAppState?.() ?? {};
  const scrollX: number = appState.scrollX ?? 0;
  const scrollY: number = appState.scrollY ?? 0;
  const zoom: number = appState.zoom?.value ?? appState.zoom ?? 1;

  return (
    <div style={styles.overlay}>
      {collaborators.map((c) => {
        if (!c.cursor) return null;
        const { x, y } = toScreen(c.cursor.x, c.cursor.y, scrollX, scrollY, zoom);

        return (
          <div
            key={c.clientID}
            style={{
              ...styles.cursorWrapper,
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none" style={styles.cursorSvg}>
              <path
                d="M0 0 L0 16 L5 11 L9 20 L11 19 L7 10 L14 10 Z"
                fill={c.color}
                stroke="rgba(0,0,0,0.4)"
                strokeWidth="1"
              />
            </svg>
            <div style={{ ...styles.label, backgroundColor: c.color }}>
              {c.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: 50,
    overflow: 'hidden',
  },
  cursorWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '4px',
    willChange: 'transform',
  },
  cursorSvg: {
    display: 'block',
    flexShrink: 0,
  },
  label: {
    marginTop: '2px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#000',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
    letterSpacing: '0.01em',
  },
};
