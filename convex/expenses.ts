import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query to get all expenses (shared between users)
export const getExpenses = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.id("categories")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("expenses");
    
    // Apply filters
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }
    
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }
    
    if (args.startDate) {
      query = query.filter((q) => q.gte(q.field("date"), args.startDate!));
    }
    
    if (args.endDate) {
      query = query.filter((q) => q.lte(q.field("date"), args.endDate!));
    }
    
    const expenses = await query
      .order("desc")
      .take(args.limit ?? 50);
    
    // Get category details for each expense
    const expensesWithCategories = await Promise.all(
      expenses.map(async (expense) => {
        const category = await ctx.db.get(expense.category);
        const user = await ctx.db.get(expense.addedBy);
        return {
          ...expense,
          categoryDetails: category,
          userDetails: user ? { name: user.name, email: user.email } : null,
        };
      })
    );
    
    return expensesWithCategories;
  },
});

// Query to get monthly spending summary
export const getMonthlySummary = query({
  args: {
    month: v.string(), // "2025-09"
  },
  handler: async (ctx, args) => {
    const startDate = `${args.month}-01`;
    const endDate = `${args.month}-31`;
    
    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect();
    
    const totalIncome = expenses
      .filter(e => e.type === "income")
      .reduce((sum, e) => sum + e.amount, 0);
      
    const totalExpenses = expenses
      .filter(e => e.type === "expense")
      .reduce((sum, e) => sum + e.amount, 0);
    
    // Group by category
    const categoryTotals = new Map<string, { amount: number; count: number; categoryName: string }>();
    
    for (const expense of expenses.filter(e => e.type === "expense")) {
      const category = await ctx.db.get(expense.category);
      const categoryName = category?.name ?? "Unknown";
      const current = categoryTotals.get(expense.category) ?? { amount: 0, count: 0, categoryName };
      categoryTotals.set(expense.category, {
        amount: current.amount + expense.amount,
        count: current.count + 1,
        categoryName,
      });
    }
    
    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      expenseCount: expenses.filter(e => e.type === "expense").length,
      incomeCount: expenses.filter(e => e.type === "income").length,
      categoryBreakdown: Array.from(categoryTotals.entries()).map(([categoryId, data]) => ({
        categoryId,
        ...data,
      })),
    };
  },
});

// Mutation to add a new expense
export const addExpense = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    category: v.id("categories"),
    account: v.string(),
    date: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    source: v.optional(v.union(v.literal("manual"), v.literal("monzo"), v.literal("import"))),
    monzoTransactionId: v.optional(v.string()),
    merchant: v.optional(v.string()),
    address: v.optional(v.string()),
    originalCategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to add expense");
    }
    
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .unique();
      
    if (!user) {
      throw new Error("User not found");
    }
    
    const expenseId = await ctx.db.insert("expenses", {
      amount: args.amount,
      description: args.description,
      category: args.category,
      account: args.account,
      date: args.date,
      type: args.type,
      source: args.source ?? "manual",
      addedBy: user._id,
      createdAt: Date.now(),
      monzoTransactionId: args.monzoTransactionId,
      merchant: args.merchant,
      address: args.address,
      originalCategory: args.originalCategory,
    });
    
    return expenseId;
  },
});

// Mutation to update an expense
export const updateExpense = mutation({
  args: {
    id: v.id("expenses"),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    category: v.optional(v.id("categories")),
    account: v.optional(v.string()),
    date: v.optional(v.string()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to update expense");
    }
    
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    
    return id;
  },
});

// Mutation to delete an expense
export const deleteExpense = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to delete expense");
    }
    
    await ctx.db.delete(args.id);
    return true;
  },
});