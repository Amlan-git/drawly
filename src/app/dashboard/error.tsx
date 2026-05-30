'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <AlertTriangle size={32} color="#f87171" />
        <h1 style={styles.title}>Something went wrong</h1>
        <p style={styles.message}>
          {error.message || 'Failed to load your dashboard. Please try again.'}
        </p>
        <div style={styles.actions}>
          <button onClick={reset} style={styles.retryBtn}>
            <RefreshCw size={14} />
            Try again
          </button>
          <Link href="/" style={styles.homeLink}>Go to canvas</Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '48px 40px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  message: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.6,
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  retryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 20px',
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  homeLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 20px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
  },
};
