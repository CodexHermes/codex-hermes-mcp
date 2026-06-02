#!/usr/bin/env node

import { startHttpServer } from "./httpServer.js";
import { startStdioMcpServer } from "./mcpServer.js";

async function main() {
  if (process.env.MCP_STDIO === "1") {
    await startStdioMcpServer();
    return;
  }

  const port = Number(process.env.PORT) || 3001;
  await startHttpServer(port);
}

main().catch((error) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
