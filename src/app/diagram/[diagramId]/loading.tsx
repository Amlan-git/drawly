import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DiagramLoading() {
  return (
    <div style={styles.page}>
      <Loader2 size={28} style={styles.spinner} />
      <p style={styles.text}>Loading diagram...</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#121212',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    color: 'rgba(255,255,255,0.4)',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    color: 'rgba(255,255,255,0.3)',
  },
  text: {
    fontSize: '13px',
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    margin: 0,
  },
};
