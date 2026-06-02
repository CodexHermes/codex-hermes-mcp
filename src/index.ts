#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  getSkill,
  getSkillInputSchema,
} from "./tools/getSkill.js";
import {
  getSkillContent,
  getSkillContentInputSchema,
} from "./tools/getSkillContent.js";
import {
  recordInvocation,
  recordInvocationInputSchema,
} from "./tools/recordInvocation.js";
import {
  searchSkills,
  searchSkillsInputSchema,
} from "./tools/searchSkills.js";

const SERVER_NAME = process.env.MCP_SERVER_NAME ?? "codex-hermes-mcp";
const SERVER_VERSION = "1.0.0";

function jsonResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(message: string) {
  return {
    content: [
      {
        type: "text" as const,
        text: message,
      },
    ],
    isError: true,
  };
}

async function main() {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.registerTool(
    "codex_search_skills",
    {
      description:
        "Search active skills in the Codex Hermes registry. Matches query against name, description, and category.",
      inputSchema: searchSkillsInputSchema,
    },
    async (args) => {
      try {
        const result = await searchSkills(args);
        return jsonResult(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown search error.";
        return errorResult(message);
      }
    },
  );

  server.registerTool(
    "codex_get_skill",
    {
      description:
        "Get full metadata for a single Codex Hermes skill by slug or id.",
      inputSchema: getSkillInputSchema,
    },
    async (args) => {
      try {
        const result = await getSkill(args);
        return jsonResult(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown lookup error.";
        return errorResult(message);
      }
    },
  );

  server.registerTool(
    "codex_get_skill_content",
    {
      description:
        "Fetch the markdown skill file from IPFS for a Codex Hermes skill by slug or id.",
      inputSchema: getSkillContentInputSchema,
    },
    async (args) => {
      try {
        const result = await getSkillContent(args);
        return jsonResult(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown content error.";
        return errorResult(message);
      }
    },
  );

  server.registerTool(
    "codex_record_invocation",
    {
      description:
        "Record a skill invocation in Codex Hermes and increment usage_count when possible.",
      inputSchema: recordInvocationInputSchema,
    },
    async (args) => {
      try {
        const result = await recordInvocation(args);
        return jsonResult(result);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown invocation recording error.";
        return errorResult(message);
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
