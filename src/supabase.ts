import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  author_wallet: string | null;
  author_name: string | null;
  ipfs_cid: string | null;
  ipfs_url: string | null;
  version: string | null;
  price: number | null;
  status: string | null;
  usage_count: number | null;
  created_at: string | null;
}

export interface SkillSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  author_name: string | null;
  version: string | null;
  usage_count: number | null;
  ipfs_cid: string | null;
  ipfs_url: string | null;
}

export interface InvocationRecord {
  id: string;
  skill_id: string;
  agent_name: string | null;
  user_wallet: string | null;
  source: string | null;
  created_at: string | null;
}

const SEARCH_SELECT =
  "id, name, slug, description, category, author_name, version, usage_count, ipfs_cid, ipfs_url";

const FULL_SELECT =
  "id, name, slug, description, category, author_wallet, author_name, ipfs_cid, ipfs_url, version, price, status, usage_count, created_at";

let supabaseClient: SupabaseClient | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = getRequiredEnv("SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    supabaseClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseClient;
}

export function getPinataGateway(): string {
  return (
    process.env.PINATA_GATEWAY?.replace(/\/$/, "") ??
    "https://gateway.pinata.cloud"
  );
}

export async function fetchActiveSkills(options: {
  query?: string;
  category?: string;
}): Promise<SkillSearchResult[]> {
  const supabase = getSupabaseClient();
  let request = supabase
    .from("skills")
    .select(SEARCH_SELECT)
    .eq("status", "active")
    .order("usage_count", { ascending: false });

  if (options.category) {
    request = request.eq("category", options.category);
  }

  if (options.query) {
    const term = options.query.trim();
    if (term) {
      const pattern = `%${term}%`;
      request = request.or(
        `name.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`,
      );
    }
  }

  const { data, error } = await request;

  if (error) {
    throw new Error(`Failed to search skills: ${error.message}`);
  }

  return (data ?? []) as SkillSearchResult[];
}

export async function fetchSkillByIdOrSlug(options: {
  id?: string;
  slug?: string;
  activeOnly?: boolean;
}): Promise<Skill | null> {
  const { id, slug, activeOnly } = options;

  if (!id && !slug) {
    throw new Error("Either id or slug must be provided.");
  }

  const supabase = getSupabaseClient();
  let request = supabase.from("skills").select(FULL_SELECT);

  if (activeOnly) {
    request = request.eq("status", "active");
  }

  if (id) {
    request = request.eq("id", id);
  } else if (slug) {
    request = request.eq("slug", slug);
  }

  const { data, error } = await request.maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch skill: ${error.message}`);
  }

  return (data as Skill | null) ?? null;
}

export async function insertInvocation(options: {
  skillId: string;
  agentName?: string;
  userWallet?: string;
}): Promise<InvocationRecord> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("invocations")
    .insert({
      skill_id: options.skillId,
      agent_name: options.agentName ?? null,
      user_wallet: options.userWallet ?? null,
      source: "mcp",
    })
    .select("id, skill_id, agent_name, user_wallet, source, created_at")
    .single();

  if (error) {
    throw new Error(`Failed to record invocation: ${error.message}`);
  }

  return data as InvocationRecord;
}

export async function incrementSkillUsageCount(skillId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: skill, error: fetchError } = await supabase
    .from("skills")
    .select("usage_count")
    .eq("id", skillId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(
      `Failed to read skill usage count: ${fetchError.message}`,
    );
  }

  if (!skill) {
    return;
  }

  const nextCount = (skill.usage_count ?? 0) + 1;

  const { error: updateError } = await supabase
    .from("skills")
    .update({ usage_count: nextCount })
    .eq("id", skillId);

  if (updateError) {
    throw new Error(
      `Failed to increment usage count: ${updateError.message}`,
    );
  }
}
