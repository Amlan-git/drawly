'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { saveSceneToLocalStorage, loadSceneFromLocalStorage } from '@/lib/local-storage';
import { useAuth } from '@/hooks/useAuth';
import { createDiagramFromRoom } from '@/lib/db-persistence';
import { CloudSync, Loader2, Image as ImageIcon, FileCode, X } from 'lucide-react';
import { exportCanvas } from '@/lib/export';
import AppHeader from '@/components/shell/AppHeader';
import WorkspaceBackground from '@/components/ui/WorkspaceBackground';
import CursorOverlay from './CursorOverlay';
import ActiveCollaborators from './ActiveCollaborators';

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
  const { ydoc, elementsMap, status, isSynced, collaborators, identity, updateCursor } = useRoom(roomToken);
  const { user } = useAuth();
  const router = useRouter();

  const [initialData, setInitialData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Track whether the first remote sync has been applied so we don't overwrite local edits
  const remoteSyncApplied = useRef(false);
  const excalidrawRef = useRef<any>(null);
  const lastUpdateFromRemote = useRef<number>(0);

  // Stable callback — never recreated, so Excalidraw never sees a changed prop reference
  const setExcalidrawAPI = useCallback((api: any) => { excalidrawRef.current = api; }, []);

  // Phase 1: load immediately from localStorage — never block on WebSocket
  useEffect(() => {
    const localData = loadSceneFromLocalStorage(roomToken);
    setInitialData({
      elements: localData?.elements ?? [],
      appState: {
        ...(localData?.appState ?? {}),
        theme: 'dark',
        viewBackgroundColor: 'transparent',
      },
    });
  }, [roomToken]);

  // Phase 2: once WS syncs and remote doc has elements, hot-swap into the live scene
  useEffect(() => {
    if (!isSynced || remoteSyncApplied.current) return;
    if (elementsMap.size === 0) return; // remote doc is empty — keep local state

    remoteSyncApplied.current = true;
    const elements = Array.from(elementsMap.values()) as ExcalidrawElement[];
    if (excalidrawRef.current) {
      // Canvas is already mounted — apply as a live update
      excalidrawRef.current.updateScene({ elements });
    } else {
      // Canvas not yet mounted — override initialData before first render
      setInitialData((prev: any) => ({ ...prev, elements }));
    }
  }, [isSynced, elementsMap]);

  // Sync remote Yjs changes into Excalidraw
  // Continuously apply remote Yjs updates into the live Excalidraw scene
  useEffect(() => {
    if (!ydoc) return;

    const handleYjsChange = (event: any) => {
      if (event.transaction.origin === 'local') return;
      if (!excalidrawRef.current) return;

      const elements = Array.from(elementsMap.values()) as ExcalidrawElement[];
      excalidrawRef.current.updateScene({ elements });
      lastUpdateFromRemote.current = Date.now();
    };

    ydoc.on('update', handleYjsChange);
    return () => ydoc.off('update', handleYjsChange);
  }, [elementsMap, ydoc]);

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
    await exportCanvas(
      type,
      excalidrawRef.current.getSceneElements(),
      excalidrawRef.current.getAppState(),
      excalidrawRef.current.getFiles(),
      `room-export-${roomToken}`
    );
  };

  const handleSaveToCloud = async () => {
    if (!user || !excalidrawRef.current) return;

    setIsSaving(true);
    setSaveError(null);
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
      setSaveError(error.message ?? 'Failed to save diagram');
    } finally {
      setIsSaving(false);
    }
  };

  // Wait only for initialData to be set (from localStorage — happens synchronously on mount)
  if (!initialData) {
    return (
      <div style={styles.loadingOverlay}>
        <div style={styles.loadingContent}>
          <Loader2 className="animate-spin" size={32} />
          <p style={styles.loadingText}>Loading Canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <AppHeader roomToken={roomToken} isLive={status === 'connected'} />
      <WorkspaceBackground />

      {/* Remote cursor overlays — reads scroll/zoom from excalidrawRef directly */}
      <CursorOverlay
        collaborators={collaborators}
        excalidrawRef={excalidrawRef}
      />

      {/* Save error toast */}
      {saveError && (
        <div style={styles.errorToast}>
          <span style={styles.errorText}>{saveError}</span>
          <button onClick={() => setSaveError(null)} style={styles.errorClose}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Bottom action bar */}
      <div style={styles.bottomOverlay}>
        <div style={styles.bottomRow}>
          {/* Status + active collaborators — left side */}
          <div style={styles.leftCluster}>
            <div style={styles.statusBadge}>
              <div style={{
                ...styles.statusDot,
                backgroundColor: status === 'connected' ? '#4ade80' : status === 'connecting' ? '#facc15' : '#f87171'
              }} />
              <span>{status === 'connected' ? 'Live' : status === 'connecting' ? 'Connecting' : 'Offline'}</span>
            </div>

            <ActiveCollaborators
              collaborators={collaborators}
              localName={identity.name}
              localColor={identity.color}
            />
          </div>

          {/* Export + save — centre */}
          <div style={styles.buttonGroup}>
            <button onClick={() => handleExport('png')} style={styles.exportButton} title="Export as PNG">
              <ImageIcon size={18} />
            </button>
            <button onClick={() => handleExport('svg')} style={styles.exportButton} title="Export as SVG">
              <FileCode size={18} />
            </button>

            {user && (
              <button onClick={handleSaveToCloud} disabled={isSaving} style={styles.cloudSaveButton}>
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CloudSync size={16} />}
                <span>{isSaving ? 'Saving...' : 'Save to Cloud'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={styles.canvasWrapper}>
        <Excalidraw
          excalidrawAPI={setExcalidrawAPI}
          initialData={initialData}
          onChange={handleChange}
          onPointerUpdate={handlePointerUpdate}
          theme="dark"
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
  canvasWrapper: {
    position: 'absolute',
    top: 'var(--header-height, 56px)',
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
    bottom: '20px',
    left: 0,
    right: 0,
    zIndex: 100,
    pointerEvents: 'none',
    padding: '0 20px',
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    pointerEvents: 'auto',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: '5px 12px',
    borderRadius: '99px',
    fontSize: '11px',
    color: '#fff',
    backdropFilter: 'blur(8px)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  },
  errorToast: {
    position: 'fixed',
    top: '72px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#450a0a',
    border: '1px solid #f87171',
    borderRadius: '8px',
    padding: '10px 16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  errorText: {
    fontSize: '13px',
    color: '#fca5a5',
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: '#f87171',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
  },
};
