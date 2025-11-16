import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ensureDemoUser, getDemoUser } from "./guestUser";

// Query to get current user info
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await getDemoUser(ctx);
  },
});

// Query to get all users (for shared expense management)
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Mutation to create or update user profile
export const createOrUpdateUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .unique();
    
    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        image: args.image,
      });
      return existingUser._id;
    }
    
    // Create new user
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
    });
    
    return userId;
  },
});

// Mutation to sync the authenticated user from Convex Auth
export const syncCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ensureDemoUser(ctx);
    return user._id;
  },
});

// Query to check if this is the user's first time (for onboarding)
export const isFirstTimeUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getDemoUser(ctx);
    
    if (!user) return true;
    
    // Check if user has any expenses or categories
    const userExpenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("addedBy"), user._id))
      .take(1);
      
    const userCategories = await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("createdBy"), user._id))
      .take(1);
    
    return userExpenses.length === 0 && userCategories.length === 0;
  },
});
