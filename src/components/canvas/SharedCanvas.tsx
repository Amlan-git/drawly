'use client';

/**
 * SharedCanvas — read-only canvas for public sharing.
 * Renders a diagram using its share_token in viewMode.
 */

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AppHeader from '@/components/shell/AppHeader';
import { Loader2 } from 'lucide-react';

// Dynamic import for Excalidraw (SSR: false)
const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

interface SharedCanvasProps {
  initialData: {
    elements: any[];
    appState: any;
    title: string;
  };
}

export default function SharedCanvas({ initialData }: SharedCanvasProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div style={styles.loadingScreen}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <AppHeader />
      
      <div style={styles.titleBar}>
        <h1 style={styles.title}>{initialData.title}</h1>
        <span style={styles.badge}>Read Only</span>
      </div>

      <div style={styles.canvasWrapper}>
        <Excalidraw
          initialData={{
            elements: initialData.elements,
            appState: {
              ...initialData.appState,
              theme: 'dark',
              viewModeEnabled: true, // Force read-only
            },
          }}
          theme="dark"
          viewModeEnabled={true}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#121212',
  },
  titleBar: {
    position: 'fixed',
    top: '64px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    pointerEvents: 'none',
  },
  title: {
    margin: 0,
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'center',
  },
  badge: {
    fontSize: '10px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.5)',
    padding: '1px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  canvasWrapper: {
    flex: 1,
    marginTop: '0',
    position: 'relative',
    height: '100%',
  },
  loadingScreen: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    color: 'rgba(255,255,255,0.2)',
  },
};
