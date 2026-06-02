# Codex Hermes MCP Server

MCP server for the [Codex Hermes](https://codex-hermes.vercel.app) skill registry. Exposes tools to search skills, fetch metadata, load markdown content from IPFS, and record invocations.

Built with Node.js, TypeScript, and the official [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk).

The server supports two modes:

- **stdio MCP** — for local Hermes Agent, Cursor, and Claude Desktop
- **HTTP** — for Render and other cloud deployments

## Tools (stdio MCP)

| Tool | Description |
| --- | --- |
| `codex_search_skills` | Search active skills by query and/or category |
| `codex_get_skill` | Get full metadata for one skill by `slug` or `id` |
| `codex_get_skill_content` | Fetch markdown content from IPFS with gateway fallbacks |
| `codex_record_invocation` | Insert an invocation row and increment `usage_count` when possible |

## Requirements

- Node.js 20+
- Supabase project with `skills` and `invocations` tables
- Supabase **service role** key (server-side only)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment template and fill in values:

```bash
cp .env.example .env
```

Required variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PINATA_GATEWAY=https://gateway.pinata.cloud
MCP_SERVER_NAME=codex-hermes-mcp
```

**Security:** Never commit `.env` or expose `SUPABASE_SERVICE_ROLE_KEY` to clients. The service role key is used only inside this server process.

3. Build:

```bash
npm run build
```

## Local stdio MCP usage

When `RENDER` and `PORT` are **not** set, the server starts in stdio MCP mode for local agents.

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### Cursor / Claude Desktop

Add to your MCP client config (paths adjusted for your machine):

```json
{
  "mcpServers": {
    "codex-hermes": {
      "command": "node",
      "args": ["C:/path/to/codex-hermes-mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "PINATA_GATEWAY": "https://gateway.pinata.cloud",
        "MCP_SERVER_NAME": "codex-hermes-mcp"
      }
    }
  }
}
```

Or use `tsx` during development:

```json
{
  "mcpServers": {
    "codex-hermes": {
      "command": "npx",
      "args": ["tsx", "C:/path/to/codex-hermes-mcp/src/index.ts"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Local HTTP mode (optional)

To test the HTTP API locally, set `PORT`:

```bash
# PowerShell
$env:PORT=3000; npm start

# Bash
PORT=3000 npm start
```

Then open:

- `http://localhost:3000/health`
- `http://localhost:3000/api/skills`

## Render HTTP deployment

Render sets `RENDER` and `PORT` automatically. When either is present, the server starts in **HTTP mode** and listens on `process.env.PORT` (default `3000`).

### Render setup

1. Create a **Web Service** on [Render](https://render.com) and connect this repository.
2. Configure:
   - **Runtime:** Node
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
3. Add environment variables in the Render dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PINATA_GATEWAY` (optional)
   - `MCP_SERVER_NAME` (optional)
4. Mark `SUPABASE_SERVICE_ROLE_KEY` as a secret.

Render injects `PORT` and `RENDER`, so the process stays alive as an HTTP server instead of exiting after stdio startup.

### Health check

Configure Render health checks to use:

```
GET /health
```

Example response:

```json
{
  "status": "ok",
  "service": "codex-hermes-mcp"
}
```

Replace `your-service.onrender.com` with your Render URL:

```
https://your-service.onrender.com/health
```

### HTTP API endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Plain-text status message |
| `GET` | `/health` | JSON health check for Render |
| `GET` | `/api/skills` | List active skills (`?query=` and `?category=` optional) |
| `GET` | `/api/skills/:slug` | Get one skill by slug |
| `GET` | `/api/skills/:slug/content` | Fetch markdown from IPFS with fallbacks |

Examples:

```bash
curl https://your-service.onrender.com/health
curl https://your-service.onrender.com/api/skills
curl https://your-service.onrender.com/api/skills/my-skill-slug
curl https://your-service.onrender.com/api/skills/my-skill-slug/content
```

## IPFS content fallback

`codex_get_skill_content` and `GET /api/skills/:slug/content` try sources in order:

1. `skill.ipfs_url` from Supabase
2. `{PINATA_GATEWAY}/ipfs/{ipfs_cid}`
3. `https://ipfs.io/ipfs/{ipfs_cid}`

## Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `tsx watch src/index.ts` | Local stdio MCP development |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/index.js` | Run server (HTTP if `PORT`/`RENDER` set, else stdio) |

## License

MIT
