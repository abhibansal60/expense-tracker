import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  getHouseholdMemberById,
  isHouseholdMemberId,
} from "../shared/householdMembers";

export async function getHouseholdUser(
  ctx: QueryCtx | MutationCtx,
  input: string
) {
  if (!isHouseholdMemberId(input)) {
    throw new Error(`Unknown household member: ${input}`);
  }
  const profile = getHouseholdMemberById(input);
  return await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", profile.email))
    .unique();
}

export async function ensureHouseholdUser(ctx: MutationCtx, input: string) {
  if (!isHouseholdMemberId(input)) {
    throw new Error(`Unknown household member: ${input}`);
  }
  const profile = getHouseholdMemberById(input);
  const existing = await getHouseholdUser(ctx, input);
  if (existing) {
    if (existing.name !== profile.name) {
      await ctx.db.patch(existing._id, { name: profile.name });
    }
    return existing;
  }

  const userId = await ctx.db.insert("users", {
    name: profile.name,
    email: profile.email,
    image: undefined,
  });
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Failed to create household user");
  }
  return user;
}
