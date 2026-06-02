import { z } from "zod";
import { fetchSkillByIdOrSlug } from "../supabase.js";

export const getSkillInputSchema = {
  slug: z.string().optional().describe("Skill slug"),
  id: z.string().optional().describe("Skill UUID"),
};

export async function getSkill(args: { slug?: string; id?: string }) {
  if (!args.slug && !args.id) {
    throw new Error("Either slug or id must be provided.");
  }

  const skill = await fetchSkillByIdOrSlug({
    id: args.id,
    slug: args.slug,
  });

  if (!skill) {
    const identifier = args.id ? `id "${args.id}"` : `slug "${args.slug}"`;
    throw new Error(`Skill not found for ${identifier}.`);
  }

  return { skill };
}
