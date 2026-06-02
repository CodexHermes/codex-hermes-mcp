# Codex Hermes MCP Server

MCP server for the [Codex Hermes](https://codex-hermes.vercel.app) skill registry. Exposes tools to search skills, fetch metadata, load markdown content from IPFS, and record invocations.

Built with Node.js, TypeScript, and the official [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk).

## Tools

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

**Security:** Never commit `.env` or expose `SUPABASE_SERVICE_ROLE_KEY` to clients. The service role key is used only inside this MCP server process.

3. Build and run:

```bash
npm run build
npm start
```

For local development with auto-reload:

```bash
npm run dev
```

## Cursor / Claude Desktop (stdio)

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

## MCP Inspector

Test the server locally:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## IPFS content fallback

`codex_get_skill_content` tries sources in order:

1. `skill.ipfs_url` from Supabase
2. `{PINATA_GATEWAY}/ipfs/{ipfs_cid}`
3. `https://ipfs.io/ipfs/{ipfs_cid}`

## Deploy to Render (future)

This server uses **stdio** transport for local MCP hosts. Render is best suited when you add an HTTP transport layer later. Until then, run locally or on a machine where your MCP client can spawn the process.

When you are ready to deploy a remote MCP endpoint on Render:

1. **Create a Web Service** on [Render](https://render.com).
2. Connect this repository.
3. Configure:
   - **Runtime:** Node
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start` (stdio) or your future HTTP entrypoint
4. Add environment variables in the Render dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PINATA_GATEWAY`
   - `MCP_SERVER_NAME`
5. Mark `SUPABASE_SERVICE_ROLE_KEY` as a secret. Do not expose it in logs or client configs.
6. For remote MCP clients, switch from `StdioServerTransport` to Streamable HTTP (not included in v1 stdio setup). Keep secrets on the server only.

### Render checklist

- [ ] Repository connected
- [ ] Node 20+ selected
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables set in Render dashboard
- [ ] Service role key stored as secret
- [ ] Health/logging verified via Render logs (stderr only for stdio servers)

## Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `tsx watch src/index.ts` | Local development |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/index.js` | Run compiled server |

## License

MIT
