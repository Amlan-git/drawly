'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppHeader from '@/components/shell/AppHeader';
import { ConfirmModal, PromptModal } from '@/components/ui/Modal';
import { Trash2, ExternalLink, Calendar, Plus, Loader2, Edit2 } from 'lucide-react';

interface Diagram {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Diagram | null>(null);
  const [renameTarget, setRenameTarget] = useState<Diagram | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchDiagrams();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchDiagrams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('diagrams')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user?.id)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching diagrams:', error.message);
    } else {
      setDiagrams(data || []);
    }
    setLoading(false);
  };

  const confirmDelete = async (id: string) => {
    const { error } = await supabase
      .from('diagrams')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) {
      console.error('Error deleting diagram:', error.message);
    } else {
      setDiagrams(diagrams.filter(d => d.id !== id));
    }
  };

  const confirmRename = async (id: string, newTitle: string) => {
    const { error } = await supabase
      .from('diagrams')
      .update({ title: newTitle })
      .eq('id', id);

    if (error) {
      console.error('Error renaming diagram:', error.message);
    } else {
      setDiagrams(diagrams.map(d => d.id === id ? { ...d, title: newTitle } : d));
    }
  };

  if (authLoading || (loading && diagrams.length === 0)) {
    return (
      <div style={styles.loadingScreen}>
        <Loader2 className="animate-spin" size={32} />
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <AppHeader />

      {deleteTarget && (
        <ConfirmModal
          title="Delete Diagram"
          message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => confirmDelete(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {renameTarget && (
        <PromptModal
          title="Rename Diagram"
          label="New name"
          defaultValue={renameTarget.title}
          confirmLabel="Rename"
          onConfirm={(newTitle) => confirmRename(renameTarget.id, newTitle)}
          onClose={() => setRenameTarget(null)}
        />
      )}
      
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Your Diagrams</h1>
            <p style={styles.subtitle}>Manage and reopen your persistent engineering work.</p>
          </div>
          
          <Link href="/" style={styles.newButton}>
            <Plus size={18} />
            <span>New Diagram</span>
          </Link>
        </div>

        {diagrams.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⬡</div>
            <h2 style={styles.emptyTitle}>No diagrams yet</h2>
            <p style={styles.emptySubtitle}>Start drawing on the homepage and save it to your cloud storage.</p>
            <Link href="/" style={styles.emptyButton}>
              Go to Canvas
            </Link>
          </div>
        ) : (
          <div style={styles.grid}>
            {diagrams.map(diagram => (
              <div key={diagram.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{diagram.title}</h3>
                  <div style={styles.cardActions}>
                    <button
                      onClick={() => setRenameTarget(diagram)}
                      style={styles.actionIconButton}
                      title="Rename"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(diagram)}
                      style={styles.actionIconButton}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div style={styles.cardMeta}>
                  <div style={styles.metaItem}>
                    <Calendar size={12} />
                    <span>{new Date(diagram.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <Link href={`/diagram/${diagram.id}`} style={styles.openButton}>
                  <span>Open Diagram</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#fff',
    paddingTop: '56px',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  newButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#fff',
    color: '#000',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'transform 0.2s ease',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'border-color 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.9)',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  actionIconButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.3)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'color 0.2s ease, background-color 0.2s ease',
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  openButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 500,
    textDecoration: 'none',
    marginTop: 'auto',
    transition: 'background-color 0.2s ease',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 0',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '48px',
    color: 'rgba(255, 255, 255, 0.1)',
    marginBottom: '24px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '12px',
  },
  emptySubtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.4)',
    maxWidth: '400px',
    marginBottom: '32px',
  },
  emptyButton: {
    padding: '12px 24px',
    backgroundColor: '#fff',
    color: '#000',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  loadingScreen: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    gap: '16px',
  },
  loadingText: {
    fontSize: '14px',
  },
};
