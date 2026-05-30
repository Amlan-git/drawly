'use client';


import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { saveSceneToLocalStorage, loadSceneFromLocalStorage } from '@/lib/local-storage';
import { useAuth } from '@/hooks/useAuth';
import { createDiagramFromRoom } from '@/lib/db-persistence';
import { CloudSync, Loader2, Image as ImageIcon, FileCode, X } from 'lucide-react';
import WorkspaceBackground from '@/components/ui/WorkspaceBackground';
import { exportCanvas } from '@/lib/export';

import "@excalidraw/excalidraw/index.css";

const ExcalidrawComponent = dynamic(
  () => import('./CustomExcalidraw'),
  {
    ssr: false,
    loading: () => (
      <div className="drawly-loading">
        <div className="drawly-loading-spinner" />
      </div>
    ),
  }
);

const DARK_THEME = "dark" as const;

interface InitialCanvasData {
  elements: any[];
  appState: Record<string, unknown>;
}

export default function DrawlyCanvas() {
  const { user } = useAuth();
  const router = useRouter();
  const [initialData, setInitialData] = useState<InitialCanvasData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const excalidrawApiRef = useRef<any>(null);

  useEffect(() => {
    const saved = loadSceneFromLocalStorage();
    if (saved) {
      setInitialData({
        elements: saved.elements,
        appState: {
          ...saved.appState,
          theme: DARK_THEME,
          viewBackgroundColor: "transparent",
        },
      });
    } else {
      setInitialData({
        elements: [],
        appState: {
          theme: DARK_THEME,
          viewBackgroundColor: "transparent",
        },
      });
    }
    setIsReady(true);
  }, []);

  const handleChange = useCallback(
    (elements: readonly any[], appState: any) => {
      saveSceneToLocalStorage(elements, appState);
    },
    []
  );

  const handleSaveToCloud = async () => {
    if (!user || !excalidrawApiRef.current) return;

    setIsSaving(true);
    try {
      const elements = excalidrawApiRef.current.getSceneElements();
      const appState = excalidrawApiRef.current.getAppState();

      const diagram = await createDiagramFromRoom(
        user.id,
        "Untitled Diagram",
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

  const handleExport = async (type: 'png' | 'svg') => {
    if (!excalidrawApiRef.current) return;
    await exportCanvas(
      type,
      excalidrawApiRef.current.getSceneElements(),
      excalidrawApiRef.current.getAppState(),
      excalidrawApiRef.current.getFiles(),
      'drawly-export'
    );
  };

  if (!isReady) {
    return (
      <div style={styles.loadingOverlay}>
        <div style={styles.loadingSpinner} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <WorkspaceBackground />

      {saveError && (
        <div style={styles.errorToast}>
          <span style={styles.errorText}>{saveError}</span>
          <button onClick={() => setSaveError(null)} style={styles.errorClose}>
            <X size={14} />
          </button>
        </div>
      )}

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
        <ExcalidrawComponent
          excalidrawAPI={(api: any) => {
            excalidrawApiRef.current = api;
          }}
          initialData={initialData ?? undefined}
          onChange={handleChange}
          theme={DARK_THEME}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
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
    height: '100vh',
    width: '100vw',
    backgroundColor: '#121212',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: '32px',
    height: '32px',
    border: '2px solid rgba(255,255,255,0.1)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    transition: 'transform 0.2s ease',
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
