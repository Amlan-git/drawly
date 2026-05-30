import { useState, useEffect, useCallback, useMemo } from "react";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface Collaborator {
  clientID: number;
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number } | null;
}

// Stable palette — visually distinct on dark backgrounds
const COLORS = [
  "#f87171", // red
  "#fb923c", // orange
  "#facc15", // yellow
  "#4ade80", // green
  "#34d399", // emerald
  "#22d3ee", // cyan
  "#60a5fa", // blue
  "#a78bfa", // violet
  "#f472b6", // pink
  "#e879f9", // fuchsia
];

const IDENTITY_KEY = "drawly:identity";

function getOrCreateIdentity(): { id: string; name: string; color: string } {
  try {
    const stored = localStorage.getItem(IDENTITY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.id && parsed.name && parsed.color) return parsed;
    }
  } catch {}

  const id = Math.random().toString(36).slice(2, 10);
  const guestNum = Math.floor(Math.random() * 9000) + 1000;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const identity = { id, name: `Guest ${guestNum}`, color };

  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch {}

  return identity;
}

export function useRoom(roomToken: string) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [isSynced, setIsSynced] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  const ydoc = useMemo(() => new Y.Doc(), []);
  const elementsMap = useMemo(() => ydoc.getMap("elements"), [ydoc]);

  // Identity is stable for the browser session — created once, reused from localStorage
  const identity = useMemo(() => getOrCreateIdentity(), []);

  const provider = useMemo(() => {
    if (typeof window === "undefined") return null;

    return new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL ?? "ws://localhost:1234",
      name: roomToken,
      document: ydoc,
      onConnect: () => setStatus("connected"),
      onDisconnect: () => {
        setStatus("disconnected");
        setIsSynced(false);
      },
      onSynced: () => setIsSynced(true),
      onClose: () => {
        setStatus("disconnected");
        setIsSynced(false);
      },
    });
  }, [roomToken, ydoc]);

  // Set local user identity on awareness once the provider is ready
  useEffect(() => {
    if (!provider?.awareness) return;
    provider.awareness.setLocalStateField("user", {
      id: identity.id,
      name: identity.name,
      color: identity.color,
    });
  }, [provider, identity]);

  // Track remote collaborators from awareness
  useEffect(() => {
    if (!provider) return;

    const handleAwarenessChange = () => {
      const awareness = provider.awareness;
      if (!awareness) return;

      const states = awareness.getStates();
      const result: Collaborator[] = [];

      states.forEach((state, clientID) => {
        // Exclude ourselves
        if (clientID === awareness.clientID) return;
        const user = state.user as any;
        result.push({
          clientID,
          id: user?.id ?? clientID.toString(),
          name: user?.name ?? "Guest",
          color: user?.color ?? "#9b59b6",
          cursor: (state.cursor as any) ?? null,
        });
      });

      setCollaborators(result);
    };

    provider.awareness?.on("change", handleAwarenessChange);

    return () => {
      provider.awareness?.off("change", handleAwarenessChange);
      provider.disconnect();
      provider.destroy();
    };
  }, [provider]);

  const updateCursor = useCallback(
    (cursor: { x: number; y: number } | null) => {
      if (!provider?.awareness) return;
      provider.awareness.setLocalStateField("cursor", cursor);
    },
    [provider]
  );

  return {
    ydoc,
    elementsMap,
    status,
    isSynced,
    collaborators,
    identity,
    updateCursor,
    provider,
  };
}
