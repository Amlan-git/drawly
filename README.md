# Drawly

# Canvas-first collaborative whiteboard for engineers.

Drawly is a lightweight whiteboard app built for fast diagramming, real-time collaboration, and persistent engineering visuals; with Supabase-backed accounts, shareable rooms, and a Yjs/Hocuspocus collaboration server - powered by Excalidraw canvas. Sketch alone in a personal workspace or jump into a live room where every stroke, shape, and cursor syncs across participants in milliseconds.

🌐 **Live:** [drawlyy.vercel.app](https://drawlyy.vercel.app/)

# Core

Drawly is designed around a simple idea:

Open the app. Start drawing. Collaborate when needed. Save only when it matters.

Unlike heavy whiteboard tools that force accounts, workspaces, and setup before the canvas, Drawly starts directly on the canvas. Anonymous users can draw immediately, while authenticated users can save diagrams, manage them from a dashboard, and share read-only links.

## Key Features

**Excalidraw Canvas, Unmodified**
- Full Excalidraw 0.18 feature set: shapes, freehand, libraries, laser pointer
- PNG / SVG / `.excalidraw` export preserved
- Light + dark themes follow system or user preference

**Live Collaboration Rooms**
- Yjs CRDT state synced over WebSocket via Hocuspocus
- Awareness layer for live cursors, selection, and presence
- Share a room by URL — no account required to join
- Ephemeral room model (no Redis, no DB writes per stroke) keeps the server stateless and cheap to host

**Authenticated Workspace**
- Supabase Auth (email + OAuth) gates the personal dashboard
- Diagrams persisted to Postgres via Supabase with row-level security
- Per-diagram share tokens for read-only public links

## License

MIT

**Production-Ready Server**
- Origin-allowlisted WebSocket connections
- `/healthz` endpoint for platform health checks (Render-friendly)
- Compiled TypeScript output for fast cold starts
- Bound to `0.0.0.0` with `PORT` env injection out of the box

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16, React 19, TypeScript 5 |
| Canvas | `@excalidraw/excalidraw` 0.18 |
| Realtime | Yjs 13, `@hocuspocus/server` & `/provider` 3 |
| Auth + DB | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Styling | Tailwind CSS |
| Tooling | `tsx`, `concurrently`, ESLint 9 |

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  Next.js 16 (App)   │  HTTPS  │   Supabase           │
│  - Excalidraw UI    │ ──────► │   - Auth             │
│  - Dashboard        │         │   - Postgres (RLS)   │
│  - Share routes     │         └──────────────────────┘
│  Vercel             │
│         │           │   WSS    ┌──────────────────────┐
│         └───────────┼────────► │  Hocuspocus + Yjs    │
│                     │          │  (Render Free tier)  │
└─────────────────────┘          └──────────────────────┘
```
- **Frontend** — Next.js 16 (App Router) + React 19 on Vercel
- **Auth & Persistence** — Supabase (Auth + Postgres)
- **Realtime** — Hocuspocus server on Render, Yjs CRDT documents in memory
- **No Redis, no message bus** — rooms are ephemeral and rebuilt from client state

Drawly separates real-time collaboration from durable persistence:

Yjs / Hocuspocus = live collaboration
Supabase         = saved diagrams, auth, ownership, sharing
localStorage     = anonymous instant canvas persistence

## Getting Started

### Prerequisites
- Node.js 20+
- A Supabase project (free tier is fine)

### Installation

```bash
git clone https://github.com/<your-username>/drawly.git
cd drawly
npm install
cd server && npm install && cd ..
```

### Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_HOCUSPOCUS_URL=ws://localhost:1234
```

For the collab server (`server/.env` or shell env):

```env
PORT=1234
ALLOWED_ORIGINS=http://localhost:3002,https://drawlyy.vercel.app
```

Apply the schema in `src/database/schema.sql` to your Supabase project.

### Run

```bash
npm run dev
```

This starts both the Next.js app on **http://localhost:3002** and the Hocuspocus server on **ws://localhost:1234** concurrently.

## Routes

| Path | Purpose |
|---|---|
| `/` | Landing + anonymous canvas |
| `/dashboard` | Authenticated user's diagrams |
| `/diagram/[diagramId]` | Owned diagram (persistent) |
| `/room/[roomToken]` | Live collaboration room (ephemeral) |
| `/shared/[shareToken]` | Read-only public share |
| `/auth/callback` | Supabase OAuth callback |

## Deployment

- **Frontend** → Vercel. Set the `NEXT_PUBLIC_*` env vars in the project dashboard.
- **Collab server** → Render (or any Node host). Point it at `server/dist/index.js` and set `PORT` + `ALLOWED_ORIGINS`.
- **Database** → Supabase managed Postgres with RLS policies from `schema.sql`.

## License

MIT

