import { z } from "zod";
import {
  fetchSkillByIdOrSlug,
  incrementSkillUsageCount,
  insertInvocation,
} from "../supabase.js";

export const recordInvocationInputSchema = {
  skill_id: z.string().describe("UUID of the skill being invoked"),
  agent_name: z
    .string()
    .optional()
    .describe("Name of the agent invoking the skill"),
  user_wallet: z
    .string()
    .optional()
    .describe("Wallet address of the user invoking the skill"),
};

export async function recordInvocation(args: {
  skill_id: string;
  agent_name?: string;
  user_wallet?: string;
}) {
  const skill = await fetchSkillByIdOrSlug({ id: args.skill_id });

  if (!skill) {
    throw new Error(`Skill not found for id "${args.skill_id}".`);
  }

  const invocation = await insertInvocation({
    skillId: args.skill_id,
    agentName: args.agent_name,
    userWallet: args.user_wallet,
  });

  let usageCountIncremented = true;
  let usageCountWarning: string | undefined;

  try {
    await incrementSkillUsageCount(args.skill_id);
  } catch (error) {
    usageCountIncremented = false;
    usageCountWarning =
      error instanceof Error
        ? error.message
        : "Failed to increment usage count.";
  }

  return {
    invocation,
    usage_count_incremented: usageCountIncremented,
    ...(usageCountWarning ? { usage_count_warning: usageCountWarning } : {}),
  };
}
