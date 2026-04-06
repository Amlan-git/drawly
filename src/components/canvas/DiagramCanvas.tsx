'use client';

/**
 * Persistent diagram canvas.
 * Handles debounced saves and public sharing.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/shell/AppHeader';
import { Loader2, CloudCheck, Cloud, Share2, Copy, Check, Globe, Lock, Download, Image as ImageIcon, FileCode } from 'lucide-react';
import { toggleDiagramSharing } from '@/lib/db-persistence';
import WorkspaceBackground from '@/components/ui/WorkspaceBackground';

const Excalidraw = dynamic(
  () => import('./CustomExcalidraw'),
  { ssr: false }
);

interface DiagramCanvasProps {
  diagramId: string;
  initialData: {
    elements: any[];
    appState: any;
    title: string;
    share_token?: string | null;
  };
}

export default function DiagramCanvas({ diagramId, initialData }: DiagramCanvasProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [title, setTitle] = useState(initialData.title);
  const [shareToken, setShareToken] = useState<string | null>(initialData.share_token || null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/shared/${shareToken}`
    : '';

  const handleToggleShare = async () => {
    if (!user) return;
    try {
      const isEnabling = !shareToken;
      const data = await toggleDiagramSharing(diagramId, user.id, isEnabling);
      setShareToken(data.share_token);
    } catch (error: any) {
      alert('Error toggling share: ' + error.message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveToCloud = useCallback(async (elements: any[], appState: any) => {
    if (!user) return;
    setSaveStatus('saving');

    const { error } = await supabase
      .from('diagrams')
      .update({
        elements,
        app_state: {
          theme: appState.theme,
          viewBackgroundColor: "#121212" // Export safely, do not save "transparent"
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', diagramId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error saving diagram:', error.message);
      setSaveStatus('error');
    } else {
      setSaveStatus('saved');
    }
  }, [diagramId, user, supabase]);

  const handleChange = (elements: readonly any[], appState: any) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    setSaveStatus('saving');

    // Debounce save
    saveTimeoutRef.current = setTimeout(() => {
      saveToCloud([...elements], appState);
    }, 2000);
  };

  const handleExport = async (type: 'png' | 'svg') => {
    if (!excalidrawAPI) return;

    const elements = excalidrawAPI.getSceneElements();
    if (!elements || elements.length === 0) return;

    const { exportToBlob } = await import('@excalidraw/excalidraw');
    
    // Keep solid dark bg for exports
    const exportAppState = {
      ...excalidrawAPI.getAppState(),
      viewBackgroundColor: "#121212"
    };

    const blob = await exportToBlob({
      elements,
      appState: exportAppState,
      files: excalidrawAPI.getFiles(),
      mimeType: type === 'png' ? 'image/png' : 'image/svg+xml',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'diagram'}.${type}`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    const { error } = await supabase
      .from('diagrams')
      .update({ title: newTitle })
      .eq('id', diagramId)
      .eq('user_id', user?.id);

    if (error) console.error('Error updating title:', error.message);
  };

  return (
    <div style={styles.container}>
      <AppHeader />
      <WorkspaceBackground />

      {/* Title Editor / Status Bar */}
      <div style={styles.titleBar}>
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          style={styles.titleInput}
          placeholder="Untitled Diagram"
        />
        <div style={styles.statusIndicator}>
          {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
          {saveStatus === 'saved' && <CloudCheck size={14} color="#4ade80" />}
          {saveStatus === 'error' && <Cloud size={14} color="#f87171" />}
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Cloud Synced' : 'Save Failed'}
          </span>
        </div>
      </div>

      {/* Share / Export Controls */}
      <div style={styles.topRightControls}>
        <div style={styles.buttonGroup}>
          <button
            onClick={() => handleExport('png')}
            style={styles.controlButton}
            title="Export as PNG"
          >
            <ImageIcon size={16} />
          </button>
          <button
            onClick={() => handleExport('svg')}
            style={styles.controlButton}
            title="Export as SVG"
          >
            <FileCode size={16} />
          </button>
          <button
            onClick={() => setShowShareModal(!showShareModal)}
            style={{
              ...styles.controlButton,
              backgroundColor: shareToken ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: shareToken ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Share2 size={16} color={shareToken ? '#4ade80' : '#fff'} />
            <span style={{ color: shareToken ? '#4ade80' : '#fff' }}>Share</span>
          </button>
        </div>

        {showShareModal && (
          <div style={styles.shareMenu}>
            <div style={styles.shareHeader}>
              <h4 style={{ margin: 0, fontSize: '14px' }}>Public Sharing</h4>
              <button
                onClick={handleToggleShare}
                style={{
                  ...styles.toggleButton,
                  backgroundColor: shareToken ? '#4ade80' : 'rgba(255,255,255,0.1)'
                }}
              >
                {shareToken ? <Globe size={14} color="#000" /> : <Lock size={14} />}
                <span style={{ color: shareToken ? '#000' : '#fff' }}>
                  {shareToken ? 'Public' : 'Private'}
                </span>
              </button>
            </div>

            {shareToken && (
              <div style={styles.linkContainer}>
                <input
                  readOnly
                  value={shareUrl}
                  style={styles.linkInput}
                />
                <button onClick={copyToClipboard} style={styles.copyButton}>
                  {copied ? <Check size={14} color="#4ade80" /> : <Copy size={16} />}
                </button>
              </div>
            )}
            <p style={styles.shareInfo}>
              Anyone with this link can view a read-only version of this diagram.
            </p>
          </div>
        )}
      </div>

      <div style={styles.canvasWrapper}>
        <Excalidraw
          excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
          initialData={{
            elements: initialData.elements,
            appState: {
              ...initialData.appState,
              theme: 'dark',
              viewBackgroundColor: 'transparent'
            },
          }}
          onChange={handleChange}
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
  titleBar: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    pointerEvents: 'none',
  },
  titleInput: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'center',
    outline: 'none',
    pointerEvents: 'auto',
    width: '300px',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: '2px 8px',
    borderRadius: '4px',
    backdropFilter: 'blur(4px)',
  },
  canvasWrapper: {
    position: 'absolute',
    top: 'var(--header-height)',
    left: 0,
    right: 0,
    bottom: 0,
  },
  topRightControls: {
    position: 'fixed',
    top: '72px',
    right: '24px',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '12px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
  controlButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    transition: 'background-color 0.2s',
  },
  shareMenu: {
    width: '320px',
    backgroundColor: '#1a1a1a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    pointerEvents: 'auto',
  },
  shareHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  linkContainer: {
    display: 'flex',
    gap: '8px',
  },
  linkInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    padding: '8px 10px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    fontFamily: 'monospace',
    outline: 'none',
  },
  copyButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    padding: '8px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareInfo: {
    margin: 0,
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
    lineHeight: '1.5',
  },
};
