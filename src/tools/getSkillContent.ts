import { z } from "zod";
import {
  fetchSkillByIdOrSlug,
  getPinataGateway,
  type Skill,
} from "../supabase.js";

export const getSkillContentInputSchema = {
  slug: z.string().optional().describe("Skill slug"),
  id: z.string().optional().describe("Skill UUID"),
};

const FETCH_TIMEOUT_MS = 15_000;

async function fetchUrl(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/markdown, text/plain, */*",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function buildFallbackUrls(skill: Skill): string[] {
  const urls: string[] = [];

  if (skill.ipfs_cid) {
    urls.push(`${getPinataGateway()}/ipfs/${skill.ipfs_cid}`);
    urls.push(`https://ipfs.io/ipfs/${skill.ipfs_cid}`);
  }

  return [...new Set(urls)];
}

async function fetchSkillMarkdown(skill: Skill): Promise<{
  content: string;
  fetchedFrom: string;
}> {
  const candidates: string[] = [];

  if (skill.ipfs_url) {
    candidates.push(skill.ipfs_url);
  }

  candidates.push(...buildFallbackUrls(skill));

  const uniqueCandidates = [...new Set(candidates)];

  if (uniqueCandidates.length === 0) {
    throw new Error(
      "Skill has no ipfs_url or ipfs_cid available for content retrieval.",
    );
  }

  const errors: string[] = [];

  for (const url of uniqueCandidates) {
    try {
      const content = await fetchUrl(url);
      return { content, fetchedFrom: url };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown fetch error";
      errors.push(`${url}: ${message}`);
    }
  }

  throw new Error(
    `Failed to fetch skill content from all IPFS sources.\n${errors.join("\n")}`,
  );
}

export async function getSkillContent(args: {
  slug?: string;
  id?: string;
  activeOnly?: boolean;
}) {
  if (!args.slug && !args.id) {
    throw new Error("Either slug or id must be provided.");
  }

  const skill = await fetchSkillByIdOrSlug({
    id: args.id,
    slug: args.slug,
    activeOnly: args.activeOnly,
  });

  if (!skill) {
    const identifier = args.id ? `id "${args.id}"` : `slug "${args.slug}"`;
    throw new Error(`Skill not found for ${identifier}.`);
  }

  const { content, fetchedFrom } = await fetchSkillMarkdown(skill);

  return {
    metadata: {
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      description: skill.description,
      category: skill.category,
      author_name: skill.author_name,
      version: skill.version,
      ipfs_cid: skill.ipfs_cid,
      ipfs_url: skill.ipfs_url,
      fetched_from: fetchedFrom,
    },
    content,
  };
}
