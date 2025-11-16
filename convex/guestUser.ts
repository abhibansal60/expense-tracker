import type { MutationCtx, QueryCtx } from "./_generated/server";

const DEMO_USER = {
  name: "Demo User",
  email: "demo@local.dev",
  image: undefined as string | undefined,
};

/**
 * Returns the stored demo user if present. Does not attempt to create the user,
 * so it can safely run inside queries.
 */
export async function getDemoUser(ctx: QueryCtx | MutationCtx) {
  return await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("email"), DEMO_USER.email))
    .unique();
}

/**
 * Ensures a demo user exists and returns it. Only callable from mutations.
 */
export async function ensureDemoUser(ctx: MutationCtx) {
  const existing = await getDemoUser(ctx);
  if (existing) {
    return existing;
  }

  const userId = await ctx.db.insert("users", DEMO_USER);
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Failed to create demo user");
  }

  return user;
}
