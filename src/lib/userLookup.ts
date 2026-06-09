import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// Find an auth user by email without scanning the whole user table.
//
// Prefers a `get_user_id_by_email` Postgres RPC (indexed, O(1)). Falls back to the
// old paged `listUsers` scan only if that RPC isn't present yet (so the code keeps
// working before the migration is applied). Returns null when no user matches.
export async function findUserByEmail(admin: SupabaseClient, email: string): Promise<User | null> {
  const e = email.trim().toLowerCase();

  const { data: id, error } = await admin.rpc("get_user_id_by_email", { p_email: e });
  if (!error) {
    if (!id) return null; // RPC ran and found nobody
    const { data } = await admin.auth.admin.getUserById(id as string);
    return data?.user ?? null;
  }

  // RPC missing/errored → bounded fallback scan
  for (let page = 1; page <= 50; page++) {
    const { data, error: lerr } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (lerr) return null;
    const hit = data.users.find((u) => (u.email || "").toLowerCase() === e);
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}
