import { useState, useEffect, useCallback, useMemo } from "react";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

export function useRoom(roomToken: string) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [isSynced, setIsSynced] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  // Memoize Y.Doc to prevent re-initialization
  const ydoc = useMemo(() => new Y.Doc(), []);
  const elementsMap = useMemo(() => ydoc.getMap("elements"), [ydoc]);

  const provider = useMemo(() => {
    if (typeof window === "undefined") return null;

    return new HocuspocusProvider({
      url: "ws://localhost:1234",
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

  useEffect(() => {
    if (!provider) return;

    const handleAwarenessChange = () => {
      const awareness = provider.awareness;
      if (!awareness) return;

      const states = awareness.getStates();
      const collaboratorsArray: Collaborator[] = [];

      states.forEach((state, clientID) => {
        if (clientID === awareness.clientID) return;
        
        collaboratorsArray.push({
          id: clientID.toString(),
          name: (state.user as any)?.name || "Anonymous",
          color: (state.user as any)?.color || "#9b59b6",
          cursor: (state as any).cursor,
        });
      });

      setCollaborators(collaboratorsArray);
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
      if (!provider || !provider.awareness) return;
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
    updateCursor,
    provider,
  };
}
