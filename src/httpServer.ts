import express from "express";
import { registerMcpRoutes } from "./mcpHttp.js";
import { getSkill } from "./tools/getSkill.js";
import { getSkillContent } from "./tools/getSkillContent.js";
import { searchSkills } from "./tools/searchSkills.js";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export function startHttpServer(port: number): Promise<void> {
  const app = express();

  app.use(express.json());

  app.get("/", (_req, res) => {
    res.type("text/plain").send("Codex Hermes MCP Server is running");
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "codex-hermes-mcp",
    });
  });

  registerMcpRoutes(app);

  app.get("/api/skills", async (req, res) => {
    try {
      const query =
        typeof req.query.query === "string" ? req.query.query : undefined;
      const category =
        typeof req.query.category === "string" ? req.query.category : undefined;
      const result = await searchSkills({ query, category });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: getErrorMessage(error) });
    }
  });

  app.get("/api/skills/:slug/content", async (req, res) => {
    try {
      const result = await getSkillContent({
        slug: req.params.slug,
        activeOnly: true,
      });
      res.json(result);
    } catch (error) {
      const message = getErrorMessage(error);
      const status = message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: message });
    }
  });

  app.get("/api/skills/:slug", async (req, res) => {
    try {
      const result = await getSkill({
        slug: req.params.slug,
        activeOnly: true,
      });
      res.json(result);
    } catch (error) {
      const message = getErrorMessage(error);
      const status = message.includes("not found") ? 404 : 500;
      res.status(status).json({ error: message });
    }
  });

  return new Promise((resolve) => {
    app.listen(port, () => {
      console.log(`Codex Hermes MCP HTTP server running on port ${port}`);
      resolve();
    });
  });
}
