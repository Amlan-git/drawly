'use client';

import React, { useState } from 'react';
import type { Collaborator } from '@/hooks/useRoom';

interface ActiveCollaboratorsProps {
  collaborators: Collaborator[];
  localName: string;
  localColor: string;
}

function Avatar({
  name,
  color,
  isSelf,
}: {
  name: string;
  color: string;
  isSelf?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          ...styles.avatar,
          backgroundColor: color,
          outline: isSelf ? `2px solid ${color}` : 'none',
          outlineOffset: '2px',
        }}
      >
        {initials}
      </div>
      {hovered && (
        <div style={styles.tooltip}>
          {name}
          {isSelf && <span style={styles.youBadge}> (you)</span>}
        </div>
      )}
    </div>
  );
}

export default function ActiveCollaborators({
  collaborators,
  localName,
  localColor,
}: ActiveCollaboratorsProps) {
  // Always show self + up to 5 others before collapsing
  const visible = collaborators.slice(0, 5);
  const overflow = collaborators.length - 5;

  return (
    <div style={styles.container}>
      {/* Self always first */}
      <Avatar name={localName} color={localColor} isSelf />

      {visible.map((c) => (
        <Avatar key={c.clientID} name={c.name} color={c.color} />
      ))}

      {overflow > 0 && (
        <div style={styles.overflow}>+{overflow}</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 700,
    color: '#000',
    cursor: 'default',
    border: '2px solid rgba(0,0,0,0.3)',
    flexShrink: 0,
    userSelect: 'none',
  },
  tooltip: {
    position: 'absolute',
    bottom: '36px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.85)',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 500,
    padding: '4px 8px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    zIndex: 200,
  },
  youBadge: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '10px',
  },
  overflow: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '2px solid rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.6)',
    flexShrink: 0,
  },
};
