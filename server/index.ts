import { Server } from "@hocuspocus/server";
import type { IncomingMessage, ServerResponse } from "http";

// TODO: Add @hocuspocus/extension-database for room persistence across restarts
// TODO: Add token-based room auth once Drawly supports authenticated rooms

// Render injects PORT; fall back to HOCUSPOCUS_PORT (legacy) then 1234 (local).
const PORT = parseInt(
  process.env.PORT ?? process.env.HOCUSPOCUS_PORT ?? "1234",
  10,
);

// Bind to 0.0.0.0 so Render's load balancer can reach the process.
// (Default in @hocuspocus/server v3 is "0.0.0.0" but we set it explicitly.)
const ADDRESS = process.env.HOCUSPOCUS_ADDRESS ?? "0.0.0.0";

// Exact-match origin allowlist. Comma-separated list, e.g.
//   ALLOWED_ORIGINS="https://drawlyy.vercel.app,http://localhost:3002"
// If unset → permissive (useful for local dev). If set → only listed origins
// may open a WebSocket; everything else is rejected at the auth stage.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const ORIGIN_CHECK_ENABLED = ALLOWED_ORIGINS.length > 0;

let connectionCount = 0;

const server = new Server({
  port: PORT,
  address: ADDRESS,

  // Origin check lives in onConnect — it fires for every connection in v3
  // and receives the same requestHeaders payload as onAuthenticate, without
  // being coupled to token/auth semantics. Defensive against any payload
  // shape variance so we never throw a TypeError back to the client.
  async onConnect(payload) {
    if (ORIGIN_CHECK_ENABLED) {
      const rawOrigin = payload?.requestHeaders?.origin;
      const origin = Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin;

      if (!origin) {
        console.warn("[hocuspocus] rejecting connection: missing Origin header");
        throw new Error("Origin header required");
      }
      if (!ALLOWED_ORIGINS.includes(origin)) {
        console.warn(`[hocuspocus] rejecting connection from origin="${origin}"`);
        throw new Error("Origin not allowed");
      }
    }

    connectionCount++;
    console.log(
      `[hocuspocus] + connected  room="${payload?.documentName ?? "?"}"  total=${connectionCount}`,
    );
  },

  async onDisconnect({ documentName }) {
    connectionCount = Math.max(0, connectionCount - 1);
    console.log(`[hocuspocus] - disconnected  room="${documentName}"  total=${connectionCount}`);
  },

  // Plain HTTP requests (non-upgrade). Used for Render's health checks.
  // Return undefined to let Hocuspocus apply its default handling.
  async onRequest({ request, response }: { request: IncomingMessage; response: ServerResponse }) {
    if (request.url === "/healthz" || request.url === "/health") {
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("ok");
      // Short-circuit Hocuspocus's default request handler. It explicitly
      // swallows *falsy* throws from onRequest as a "handled" signal; any
      // truthy error would be rethrown and logged as an unhandled rejection
      // on every health check. See @hocuspocus/server requestHandler:
      //   try { ...hooks... default 200 } catch (error) { if (error) throw error; }
      // eslint-disable-next-line no-throw-literal
      throw null;
    }
  },
});

server.listen().then(() => {
  console.log(`[hocuspocus] server running on ${ADDRESS}:${PORT}`);
  if (ORIGIN_CHECK_ENABLED) {
    console.log(`[hocuspocus] origin allowlist: ${ALLOWED_ORIGINS.join(", ")}`);
  } else {
    console.log(`[hocuspocus] origin allowlist: <permissive — set ALLOWED_ORIGINS to restrict>`);
  }
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
