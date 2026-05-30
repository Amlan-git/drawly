import { Server } from "@hocuspocus/server";

// TODO: Add @hocuspocus/extension-database for room persistence across restarts
// TODO: Add token-based room auth once Drawly supports authenticated rooms

const PORT = parseInt(process.env.HOCUSPOCUS_PORT ?? "1234", 10);
let connectionCount = 0;

const server = new Server({
  port: PORT,

  async onAuthenticate() {
    // Permissive for now — all connections allowed
    // TODO: Validate roomToken against Supabase to restrict access
    return true;
  },

  async onConnect({ documentName }) {
    connectionCount++;
    console.log(`[hocuspocus] + connected  room="${documentName}"  total=${connectionCount}`);
  },

  async onDisconnect({ documentName }) {
    connectionCount = Math.max(0, connectionCount - 1);
    console.log(`[hocuspocus] - disconnected  room="${documentName}"  total=${connectionCount}`);
  },
});

server.listen().then(() => {
  console.log(`[hocuspocus] server running on port ${PORT}`);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`[hocuspocus] received ${signal}, shutting down...`);
  server.destroy().then(() => {
    console.log("[hocuspocus] shutdown complete");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
