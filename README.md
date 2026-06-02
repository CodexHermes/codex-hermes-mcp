# Codex Hermes MCP Server

MCP server for the [Codex Hermes](https://codex-hermes.vercel.app) skill registry. Exposes tools to search skills, fetch metadata, load markdown content from IPFS, and record invocations.

Built with Node.js, TypeScript, and the official [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk).

The server supports:

- **HTTP (default)** — Express REST API + MCP Streamable HTTP at `POST /mcp` for Render and remote agents
- **stdio MCP** — for local Hermes Agent, Cursor, and Claude Desktop (`MCP_STDIO=1`)

## MCP tools

| Tool | Description |
| --- | --- |
| `codex_search_skills` | Search active skills by query and/or category |
| `codex_get_skill` | Get full metadata for one active skill by `slug` or `id` |
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

3. Build and run:

```bash
npm run build
npm start
```

For development:

```bash
npm run dev
```

## Hermes Agent config (remote MCP)

Point Hermes at the deployed MCP HTTP endpoint:

```yaml
mcp_servers:
  codex_hermes:
    url: "https://codex-hermes-mcp.onrender.com/mcp"
    enabled: true
```

Replace the URL with your Render service URL if different.

## Local stdio MCP usage

Set `MCP_STDIO=1` to run as a local stdio MCP server:

```bash
# PowerShell
$env:MCP_STDIO="1"; npm start

# Bash
MCP_STDIO=1 npm start
```

### Cursor / Claude Desktop

```json
{
  "mcpServers": {
    "codex-hermes": {
      "command": "node",
      "args": ["C:/path/to/codex-hermes-mcp/dist/index.js"],
      "env": {
        "MCP_STDIO": "1",
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "PINATA_GATEWAY": "https://gateway.pinata.cloud",
        "MCP_SERVER_NAME": "codex-hermes-mcp"
      }
    }
  }
}
```

### MCP Inspector (stdio)

```bash
MCP_STDIO=1 npx @modelcontextprotocol/inspector node dist/index.js
```

## HTTP endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Plain-text status message |
| `GET` | `/health` | JSON health check for Render |
| `POST` | `/mcp` | MCP Streamable HTTP endpoint (stateless) |
| `GET` | `/api/skills` | List active skills (`?query=` and `?category=` optional) |
| `GET` | `/api/skills/:slug` | Get one active skill by slug |
| `GET` | `/api/skills/:slug/content` | Fetch markdown from IPFS with fallbacks |

Default port: `process.env.PORT || 3001`

Examples:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/skills
curl http://localhost:3001/api/skills/my-skill-slug
curl http://localhost:3001/api/skills/my-skill-slug/content
```

## Render deployment

1. Create a **Web Service** on [Render](https://render.com) and connect this repository.
2. Configure:
   - **Runtime:** Node
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
3. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PINATA_GATEWAY` (optional)
   - `MCP_SERVER_NAME` (optional)
4. Set health check path to `/health`.

Render injects `PORT` automatically. The server listens on that port and exposes MCP at `/mcp`.

## IPFS content fallback

`codex_get_skill_content` and `GET /api/skills/:slug/content` try sources in order:

1. `skill.ipfs_url` from Supabase
2. `{PINATA_GATEWAY}/ipfs/{ipfs_cid}`
3. `https://ipfs.io/ipfs/{ipfs_cid}`

## Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `tsx src/index.ts` | Run HTTP server locally |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/index.js` | Run HTTP server (stdio if `MCP_STDIO=1`) |

## License

MIT
