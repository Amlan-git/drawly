'use client';

/**
 * Fixed header overlay.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Share2, Plus, Check, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { nanoid } from 'nanoid';

interface AppHeaderProps {
  roomToken?: string;
  isLive?: boolean;
}

export default function AppHeader({ roomToken, isLive }: AppHeaderProps) {
  const [copied, setCopied] = useState(false);
  const { user, signInWithGoogle, signOut, isLoading } = useAuth();
  const router = useRouter();

  const handleShare = async () => {
    if (!roomToken) return;
    const url = `${window.location.origin}/room/${roomToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNewRoom = () => {
    const newToken = nanoid(10);
    router.push(`/room/${newToken}`);
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.left}>
          <Link href="/" style={styles.logo}>
            <span style={styles.logoIcon}>⬡</span>
            <span style={styles.logoText}>Drawly</span>
          </Link>
          
          {roomToken && (
            <div style={styles.roomBadge}>
              <div style={{ ...styles.statusDot, backgroundColor: isLive ? '#4ade80' : '#94a3b8' }} />
              <span style={styles.roomTokenText}>{roomToken}</span>
              <span style={styles.liveLabel}>{isLive ? 'LIVE' : 'OFFLINE'}</span>
            </div>
          )}
        </div>

        <div style={styles.right}>
          {roomToken ? (
            <button onClick={handleShare} style={styles.actionButton}>
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
          ) : (
            <button onClick={handleNewRoom} style={styles.actionButton}>
              <Plus size={16} />
              <span>Collaborate</span>
            </button>
          )}

          <div style={styles.divider} />

          {isLoading ? (
            <div style={styles.loadingIndicator} />
          ) : user ? (
            <div style={styles.userSection}>
              <Link href="/dashboard" style={styles.dashboardLink} title="Go to Dashboard">
                <LayoutDashboard size={18} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              
              <div style={styles.userProfile}>
                {user.user_metadata.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt={user.email} 
                    style={styles.avatar}
                  />
                ) : (
                  <div style={styles.avatarFallback}>
                    <UserIcon size={14} />
                  </div>
                )}
                <button onClick={() => signOut()} style={styles.logoutButton} title="Sign Out">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => signInWithGoogle()} style={styles.loginButton}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 'var(--header-height, 56px)',
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    zIndex: 1000,
    padding: '0 16px',
    pointerEvents: 'auto',
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    maxWidth: '100%',
    margin: '0 auto',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: '#fff',
    fontWeight: 600,
    fontSize: '18px',
  },
  logoIcon: {
    fontSize: '22px',
    color: '#fff',
    fontWeight: 200,
  },
  logoText: {
    letterSpacing: '-0.01em',
  },
  roomBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 10px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '99px',
    fontSize: '12px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  roomTokenText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'monospace',
  },
  liveLabel: {
    fontWeight: 600,
    letterSpacing: '0.05em',
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
  },
  divider: {
    width: '1px',
    height: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loginButton: {
    padding: '6px 14px',
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  dashboardLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '13px',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  avatarFallback: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.4)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease',
  },
  loadingIndicator: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderTopColor: '#fff',
    borderRadius: '50%',
  },
};
