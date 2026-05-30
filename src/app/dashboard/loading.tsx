import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.skeletonTitle} />
        <div style={styles.skeletonSubtitle} />
      </div>
      <div style={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={styles.card}>
            <div style={styles.skeletonCardTitle} />
            <div style={styles.skeletonCardMeta} />
            <div style={styles.skeletonCardBtn} />
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    paddingTop: '96px',
    padding: '96px 24px 40px',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  skeletonTitle: {
    width: '220px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  skeletonSubtitle: {
    width: '340px',
    height: '16px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  grid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  skeletonCardTitle: {
    width: '70%',
    height: '18px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  skeletonCardMeta: {
    width: '40%',
    height: '12px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  skeletonCardBtn: {
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: 'auto',
  },
};
