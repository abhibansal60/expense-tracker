import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Include auth tables from Convex Auth
  ...authTables,
  
  // Users - handled by Convex Auth
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  }).index("email", ["email"]),

  // Categories for organizing expenses
  categories: defineTable({
    name: v.string(),           // "🍜 Food", "🚖 Transport"
    emoji: v.optional(v.string()), // "🍜", "🚖"
    isDefault: v.boolean(),     // true for system categories
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_user", ["createdBy"])
    .index("by_name", ["name"]),

  // Main expenses table - shared between users
  expenses: defineTable({
    amount: v.number(),
    description: v.string(),
    category: v.id("categories"),
    account: v.string(),        // "Card", "Bank", "Cash"
    date: v.string(),          // "2025-09-13"
    type: v.union(v.literal("income"), v.literal("expense")),
    source: v.union(v.literal("manual"), v.literal("monzo"), v.literal("import")),
    addedBy: v.id("users"),
    createdAt: v.number(),
    
    // Optional Monzo metadata
    monzoTransactionId: v.optional(v.string()),
    merchant: v.optional(v.string()),
    address: v.optional(v.string()),
    originalCategory: v.optional(v.string()), // Original Monzo category
  })
    .index("by_date", ["date"])
    .index("by_category", ["category"])
    .index("by_user", ["addedBy"])
    .index("by_type", ["type"])
    .index("by_source", ["source"]),

  // Monthly budgets for categories
  budgets: defineTable({
    category: v.id("categories"),
    monthlyLimit: v.number(),
    month: v.string(),          // "2025-09"
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_month", ["month"])
    .index("by_category", ["category"])
    .index("by_user", ["createdBy"]),

  // Import jobs for tracking CSV imports
  importJobs: defineTable({
    filename: v.string(),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    source: v.union(v.literal("monzo"), v.literal("money_manager")),
    totalRows: v.number(),
    processedRows: v.number(),
    errorRows: v.number(),
    startedBy: v.id("users"),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_user", ["startedBy"])
    .index("by_status", ["status"]),
});