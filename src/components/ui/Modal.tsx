'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  actions: React.ReactNode;
}

export function Modal({ title, children, onClose, actions }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={styles.overlay}
    >
      <div style={styles.panel} role="dialog" aria-modal="true">
        <div style={styles.header}>
          <span style={styles.title}>{title}</span>
          <button onClick={onClose} style={styles.closeBtn}><X size={16} /></button>
        </div>
        <div style={styles.body}>{children}</div>
        <div style={styles.footer}>{actions}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      actions={
        <>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            style={{ ...styles.confirmBtn, backgroundColor: danger ? '#ef4444' : '#fff', color: danger ? '#fff' : '#000' }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={styles.message}>{message}</p>
    </Modal>
  );
}

export function PromptModal({
  title,
  label,
  defaultValue = '',
  confirmLabel = 'Save',
  onConfirm,
  onClose,
}: {
  title: string;
  label: string;
  defaultValue?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = React.useState(defaultValue);

  const handleSubmit = () => {
    if (value.trim()) { onConfirm(value.trim()); onClose(); }
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      actions={
        <>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} style={styles.confirmBtn}>{confirmLabel}</button>
        </>
      }
    >
      <label style={styles.label}>{label}</label>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        style={styles.input}
      />
    </Modal>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    backgroundColor: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    width: '400px',
    maxWidth: '90vw',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 20px 0',
  },
  title: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
  },
  body: {
    padding: '16px 20px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '0 20px 20px',
  },
  message: {
    margin: 0,
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: '1.5',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
