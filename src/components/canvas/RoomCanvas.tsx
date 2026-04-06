'use client';


import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { saveSceneToLocalStorage, loadSceneFromLocalStorage } from '@/lib/local-storage';
import { useAuth } from '@/hooks/useAuth';
import { createDiagramFromRoom } from '@/lib/db-persistence';
import { CloudSync, Loader2, Image as ImageIcon, FileCode } from 'lucide-react';
import AppHeader from '@/components/shell/AppHeader';
import WorkspaceBackground from '@/components/ui/WorkspaceBackground';

import "@excalidraw/excalidraw/index.css";

type ExcalidrawElement = any;
type AppState = any;

const Excalidraw = dynamic(
  () => import('./CustomExcalidraw'),
  { ssr: false }
);

interface RoomCanvasProps {
  roomToken: string;
}

export default function RoomCanvas({ roomToken }: RoomCanvasProps) {
  const { ydoc, elementsMap, status, isSynced, updateCursor } = useRoom(roomToken);
  const { user } = useAuth();
  const router = useRouter();

  const [initialData, setInitialData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const excalidrawRef = useRef<any>(null);
  const lastUpdateFromRemote = useRef<number>(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isSynced || !isMounted) return;

    if (elementsMap.size > 0) {
      const elements = Array.from(elementsMap.values()) as ExcalidrawElement[];
      setInitialData({
        elements,
        appState: { theme: 'dark', viewBackgroundColor: 'transparent' },
      });
      setIsLoaded(true);
      return;
    }

    const localData = loadSceneFromLocalStorage(roomToken);
    if (localData) {
      setInitialData({
        elements: localData.elements,
        appState: { ...localData.appState, theme: 'dark', viewBackgroundColor: 'transparent' },
      });
      ydoc.transact(() => {
        localData.elements.forEach((el: any) => {
          elementsMap.set(el.id, { ...el });
        });
      }, 'local');
    } else {
      setInitialData({
        appState: { theme: 'dark', viewBackgroundColor: 'transparent' },
      });
    }
    setIsLoaded(true);
  }, [roomToken, isSynced, isMounted, elementsMap, ydoc]);

  // Sync Yjs elements to Excalidraw
  useEffect(() => {
    if (!isLoaded || !ydoc) return;

    const handleYjsChange = (event: any) => {
      if (event.transaction.origin === 'local') return;

      const elements = Array.from(elementsMap.values()) as ExcalidrawElement[];
      if (excalidrawRef.current) {
        excalidrawRef.current.updateScene({ elements });
      }
      lastUpdateFromRemote.current = Date.now();
    };

    ydoc.on('update', handleYjsChange);
    return () => ydoc.off('update', handleYjsChange);
  }, [isLoaded, elementsMap, ydoc]);

  const handleChange = useCallback((elements: readonly ExcalidrawElement[], appState: AppState) => {
    saveSceneToLocalStorage(elements, appState, roomToken);

    if (Date.now() - lastUpdateFromRemote.current < 50) return;

    ydoc.transact(() => {
      elements.forEach((el) => {
        const stored = elementsMap.get(el.id) as any;
        if (!stored || stored.version < el.version) {
          elementsMap.set(el.id, { ...el });
        }
      });

      if (elements.length < elementsMap.size) {
        const currentIds = new Set(elements.map((el) => el.id));
        Array.from(elementsMap.keys()).forEach((id) => {
          if (!currentIds.has(id)) elementsMap.delete(id);
        });
      }
    }, 'local');
  }, [elementsMap, ydoc, roomToken]);

  const handlePointerUpdate = useCallback((payload: any) => {
    updateCursor(payload.pointer);
  }, [updateCursor]);

  const handleExport = async (type: 'png' | 'svg') => {
    if (!excalidrawRef.current) return;

    const elements = excalidrawRef.current.getSceneElements();
    if (!elements || elements.length === 0) return;

    try {
      const { exportToBlob } = await import('@excalidraw/excalidraw');
      
      const currentAppState = excalidrawRef.current.getAppState();
      const exportAppState = {
        ...currentAppState,
        viewBackgroundColor: "#121212",
      };

      const blob = await exportToBlob({
        elements,
        appState: exportAppState,
        files: excalidrawRef.current.getFiles(),
        mimeType: type === 'png' ? 'image/png' : 'image/svg+xml',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `room-export-${roomToken}.${type}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleSaveToCloud = async () => {
    if (!user || !excalidrawRef.current) return;

    setIsSaving(true);
    try {
      const elements = excalidrawRef.current.getSceneElements();
      const appState = excalidrawRef.current.getAppState();

      const diagram = await createDiagramFromRoom(
        user.id,
        `Room Session (${roomToken})`,
        elements,
        appState
      );

      router.push(`/diagram/${diagram.id}`);
    } catch (error: any) {
      alert("Error saving diagram: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted || !isLoaded || !initialData) {
    return (
      <div style={styles.loadingOverlay}>
        <div style={styles.loadingContent}>
          <Loader2 className="animate-spin" size={32} />
          <p style={styles.loadingText}>Initializing Room...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <AppHeader roomToken={roomToken} isLive={status === 'connected'} />
      <WorkspaceBackground />
      
      <div style={styles.bottomOverlay}>
        <div style={styles.buttonGroup}>
          <button
            onClick={() => handleExport('png')}
            style={styles.exportButton}
            title="Export as PNG"
          >
            <ImageIcon size={18} />
          </button>
          <button
            onClick={() => handleExport('svg')}
            style={styles.exportButton}
            title="Export as SVG"
          >
            <FileCode size={18} />
          </button>

          {user && (
            <button
              onClick={handleSaveToCloud}
              disabled={isSaving}
              style={styles.cloudSaveButton}
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CloudSync size={16} />
              )}
              <span>{isSaving ? "Saving..." : "Save to Cloud"}</span>
            </button>
          )}
        </div>
      </div>

      <div style={styles.canvasWrapper}>
        <Excalidraw
          excalidrawAPI={(api: any) => (excalidrawRef.current = api)}
          initialData={initialData}
          onChange={handleChange}
          onPointerUpdate={handlePointerUpdate}
          theme="dark"
        />
      </div>

      <div style={styles.statusBadge}>
        <div style={{
          ...styles.statusDot,
          backgroundColor: status === 'connected' ? '#4ade80' : status === 'connecting' ? '#facc15' : '#f87171'
        }} />
        <span>{status === 'connected' ? 'Live' : status === 'connecting' ? 'Connecting' : 'Offline'}</span>
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
  canvasWrapper: {
    position: 'absolute',
    top: 'var(--header-height)',
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingOverlay: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#121212',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  loadingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  loadingText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  bottomOverlay: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    pointerEvents: 'none',
  },
  buttonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    pointerEvents: 'auto',
  },
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px',
    backgroundColor: 'rgba(0,0,0,0.4)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
  },
  cloudSaveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    transition: 'all 0.2s ease',
  },
  statusBadge: {
    position: 'fixed',
    bottom: '16px',
    left: '16px',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: '4px 12px',
    borderRadius: '99px',
    fontSize: '11px',
    color: '#fff',
    backdropFilter: 'blur(8px)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
};
