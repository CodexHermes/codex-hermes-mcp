import { z } from "zod";
import { fetchActiveSkills } from "../supabase.js";

export const searchSkillsInputSchema = {
  query: z
    .string()
    .optional()
    .describe("Search term matched against name, description, and category"),
  category: z.string().optional().describe("Filter by exact category name"),
};

export async function searchSkills(args: {
  query?: string;
  category?: string;
}) {
  const skills = await fetchActiveSkills({
    query: args.query,
    category: args.category,
  });

  return {
    count: skills.length,
    skills,
  };
}
