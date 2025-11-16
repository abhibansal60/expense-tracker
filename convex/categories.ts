import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ensureDemoUser } from "./guestUser";

// Query to get all categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .order("asc")
      .collect();
    
    return categories.sort((a, b) => {
      // Default categories first, then alphabetical
      if (a.isDefault !== b.isDefault) {
        return a.isDefault ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  },
});

// Query to get category by name (for auto-mapping)
export const getCategoryByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("name"), args.name))
      .unique();
  },
});

// Mutation to create a new category
export const createCategory = mutation({
  args: {
    name: v.string(),
    emoji: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ensureDemoUser(ctx);
    
    // Check if category already exists
    const existing = await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("name"), args.name))
      .unique();
      
    if (existing) {
      return existing._id;
    }
    
    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      emoji: args.emoji,
      isDefault: args.isDefault ?? false,
      createdBy: user._id,
      createdAt: Date.now(),
    });
    
    return categoryId;
  },
});

// Mutation to create default categories
export const createDefaultCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ensureDemoUser(ctx);
    
    const defaultCategories = [
      { name: "🍜 Food", emoji: "🍜" },
      { name: "🚖 Transport", emoji: "🚖" },
      { name: "Grocery", emoji: "🛒" },
      { name: "Internet", emoji: "📶" },
      { name: "Council Tax", emoji: "🏛️" },
      { name: "House RENT", emoji: "🏠" },
      { name: "Subscriptions", emoji: "📺" },
      { name: "💰 Salary", emoji: "💰" },
      { name: "Bills", emoji: "🧾" },
      { name: "Entertainment", emoji: "🎬" },
      { name: "Healthcare", emoji: "🏥" },
      { name: "Shopping", emoji: "🛍️" },
      { name: "Savings", emoji: "🏦" },
      { name: "Other", emoji: "❓" },
    ];
    
    const createdCategories = [];
    
    for (const category of defaultCategories) {
      // Check if category already exists
      const existing = await ctx.db
        .query("categories")
        .filter((q) => q.eq(q.field("name"), category.name))
        .unique();
        
      if (!existing) {
        const categoryId = await ctx.db.insert("categories", {
          name: category.name,
          emoji: category.emoji,
          isDefault: true,
          createdBy: user._id,
          createdAt: Date.now(),
        });
        createdCategories.push(categoryId);
      }
    }
    
    return createdCategories;
  },
});

// Mutation to update a category
export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    
    return id;
  },
});

// Mutation to delete a category
export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    // Check if category is used by any expenses
    const expensesUsingCategory = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("category"), args.id))
      .take(1);
      
    if (expensesUsingCategory.length > 0) {
      throw new Error("Cannot delete category that is being used by expenses");
    }
    
    await ctx.db.delete(args.id);
    return true;
  },
});
