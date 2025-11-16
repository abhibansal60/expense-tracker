import { query, mutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { ensureHouseholdUser } from "./householdUser";
import type { Doc, Id, TableNames } from "./_generated/dataModel";

const FALLBACK_CATEGORY = "General";

type DedupeInput = {
  amount: number;
  description: string;
  account: string;
  date: string;
  type: "income" | "expense";
};

export const buildExpenseDedupeKey = ({
  amount,
  description,
  account,
  date,
  type,
}: DedupeInput) => {
  const normalizedDescription = description.trim().replace(/\s+/g, " ").toLowerCase();
  const normalizedAccount = account.trim().replace(/\s+/g, " ").toLowerCase();
  const normalizedDate = date.trim();
  const normalizedType = type;
  const normalizedAmount = amount.toFixed(2);
  return `${normalizedDate}::${normalizedAmount}::${normalizedType}::${normalizedAccount}::${normalizedDescription}`;
};

// Query to get all expenses (shared between users)
export const getExpenses = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(v.id("categories")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, ...filters } = args;
    const baseQuery = buildFilteredExpenseQuery(ctx, filters);
    const paginatedExpenses = await baseQuery.paginate(paginationOpts);
    const pageWithDetails = await hydrateExpenses(ctx, paginatedExpenses.page);

    return {
      ...paginatedExpenses,
      page: pageWithDetails,
    };
  },
});

export const listRecentExpenses = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.id("categories")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
  },
  handler: async (ctx, args) => {
    const { limit, ...filters } = args;
    const baseQuery = buildFilteredExpenseQuery(ctx, filters);
    const safeLimit = normalizeLegacyLimit(limit);
    const expenses = await baseQuery.take(safeLimit);
    return hydrateExpenses(ctx, expenses);
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
    const dayTotals = new Map<string, { income: number; expense: number }>();
    const accountTotals = new Map<string, number>();

    for (const expense of expenses.filter(e => e.type === "expense")) {
      const category = await safeGetDocument(ctx, "categories", expense.category);
      const categoryName = category?.name ?? "Unknown";
      const current = categoryTotals.get(expense.category) ?? { amount: 0, count: 0, categoryName };
      categoryTotals.set(expense.category, {
        amount: current.amount + expense.amount,
        count: current.count + 1,
        categoryName,
      });

      const accountAmount = accountTotals.get(expense.account) ?? 0;
      accountTotals.set(expense.account, accountAmount + expense.amount);
    }

    for (const entry of expenses) {
      const key = entry.date;
      const totals = dayTotals.get(key) ?? { income: 0, expense: 0 };
      const bucket = entry.type === "income" ? "income" : "expense";
      totals[bucket] += entry.amount;
      dayTotals.set(key, totals);
    }

    const daysInMonth = getDaysInMonth(args.month);
    const dailySeries = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const dateLabel = `${args.month}-${String(day).padStart(2, "0")}`;
      const totals = dayTotals.get(dateLabel) ?? { income: 0, expense: 0 };
      return {
        date: dateLabel,
        income: totals.income,
        expense: totals.expense,
        dayLabel: String(day),
      };
    });

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
      dailySeries,
      accountBreakdown: Array.from(accountTotals.entries()).map(([account, amount]) => ({
        account,
        amount,
      })),
    };
  },
});

export const getAvailableMonths = query({
  args: {},
  handler: async (ctx) => {
    const expenses = await ctx.db.query("expenses").order("desc").take(500);
    const uniqueMonths = new Set<string>();

    for (const expense of expenses) {
      if (expense.date?.length >= 7) {
        uniqueMonths.add(expense.date.slice(0, 7));
      }
    }

    return Array.from(uniqueMonths).sort((a, b) => (a > b ? -1 : 1));
  },
});

// Query to return a normalized data set ready for CSV export
export const exportExpenses = query({
  args: {},
  handler: async (ctx) => {
    const expenses = await ctx.db
      .query("expenses")
      .order("desc")
      .collect();

    const categories = await ctx.db.query("categories").collect();
    const categoryMap = new Map(categories.map((category) => [category._id, category.name]));

    return expenses.map((expense) => ({
      id: expense._id,
      date: expense.date,
      description: expense.description,
      amount: expense.amount,
      type: expense.type,
      account: expense.account,
      categoryName: categoryMap.get(expense.category) ?? FALLBACK_CATEGORY,
      source: expense.source ?? "manual",
      monzoTransactionId: expense.monzoTransactionId,
      merchant: expense.merchant,
      originalCategory: expense.originalCategory,
    }));
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
    memberId: v.string(),
    recurringEntry: v.optional(v.id("recurringEntries")),
  },
  handler: async (ctx, args) => {
    const user = await ensureHouseholdUser(ctx, args.memberId);
    const { memberId: _memberId, ...rest } = args;
    void _memberId;
    const dedupeKey = buildExpenseDedupeKey({
      amount: rest.amount,
      description: rest.description,
      account: rest.account,
      date: rest.date,
      type: rest.type,
    });
    const expenseId = await ctx.db.insert("expenses", {
      amount: rest.amount,
      description: rest.description,
      category: rest.category,
      account: rest.account,
      date: rest.date,
      type: rest.type,
      source: rest.source ?? "manual",
      addedBy: user._id,
      createdAt: Date.now(),
      dedupeKey,
      monzoTransactionId: rest.monzoTransactionId,
      merchant: rest.merchant,
      address: rest.address,
      originalCategory: rest.originalCategory,
      recurringEntry: rest.recurringEntry,
    });
    
    return expenseId;
  },
});

// Mutation to bulk-import normalized expenses created on the client
export const importExpenses = mutation({
  args: {
    source: v.union(v.literal("monzo"), v.literal("money_manager")),
    entries: v.array(
      v.object({
        amount: v.number(),
        description: v.string(),
        categoryName: v.string(),
        account: v.string(),
        date: v.string(),
        type: v.union(v.literal("income"), v.literal("expense")),
        monzoTransactionId: v.optional(v.string()),
        merchant: v.optional(v.string()),
        originalCategory: v.optional(v.string()),
        memberId: v.optional(v.string()),
      })
    ),
    memberId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ensureHouseholdUser(ctx, args.memberId);
    const { entries } = args;

    if (entries.length === 0) {
      return {
        inserted: 0,
        skipped: 0,
        failed: 0,
        total: 0,
        errors: [] as { row: number; reason: string }[],
      };
    }

    const categoriesByName = new Map<string, Id<"categories">>();
    const errors: { row: number; reason: string }[] = [];
    let inserted = 0;
    let skipped = 0;

    const ensureCategoryId = async (rawName: string) => {
      const normalizedName = rawName?.trim() ? rawName.trim() : FALLBACK_CATEGORY;
      const cacheKey = normalizedName.toLowerCase();

      if (categoriesByName.has(cacheKey)) {
        return categoriesByName.get(cacheKey)!;
      }

      const existing = await ctx.db
        .query("categories")
        .withIndex("by_name", (q) => q.eq("name", normalizedName))
        .unique();

      if (existing) {
        categoriesByName.set(cacheKey, existing._id);
        return existing._id;
      }

      const created = await ctx.db.insert("categories", {
        name: normalizedName,
        emoji: undefined,
        isDefault: false,
        createdBy: user._id,
        createdAt: Date.now(),
      });

      categoriesByName.set(cacheKey, created);
      return created;
    };

    for (const [index, entry] of entries.entries()) {
      const rowNumber = index + 1;
      try {
        if (!Number.isFinite(entry.amount) || entry.amount <= 0) {
          errors.push({ row: rowNumber, reason: "Amount must be greater than 0" });
          continue;
        }

        const description = entry.description.trim();
        if (!description) {
          errors.push({ row: rowNumber, reason: "Description is required" });
          continue;
        }

        const dedupeKey = buildExpenseDedupeKey({
          amount: entry.amount,
          description,
          account: entry.account || "Card",
          date: entry.date,
          type: entry.type,
        });

        if (entry.monzoTransactionId) {
          const duplicate = await ctx.db
            .query("expenses")
            .withIndex("by_monzo_id", (q) =>
              q.eq("monzoTransactionId", entry.monzoTransactionId!)
            )
            .unique();

          if (duplicate) {
            skipped += 1;
            continue;
          }
        }

        if (dedupeKey) {
          const duplicateByKey = await ctx.db
            .query("expenses")
            .withIndex("by_dedupe_key", (q) => q.eq("dedupeKey", dedupeKey))
            .unique();

          if (duplicateByKey) {
            skipped += 1;
            continue;
          }
        }

        const categoryId = await ensureCategoryId(entry.categoryName);

        await ctx.db.insert("expenses", {
          amount: entry.amount,
          description,
          category: categoryId,
          account: entry.account || "Card",
          date: entry.date,
          type: entry.type,
          source: args.source === "monzo" ? "monzo" : "import",
          addedBy: user._id,
          createdAt: Date.now(),
          dedupeKey,
          monzoTransactionId: entry.monzoTransactionId,
          merchant: entry.merchant,
          originalCategory: entry.originalCategory,
        });

        inserted += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown import failure";
        errors.push({ row: rowNumber, reason: message });
      }
    }

    return {
      inserted,
      skipped,
      failed: errors.length,
      total: entries.length,
      errors,
    };
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
    memberId: v.string(),
  },
  handler: async (ctx, args) => {
    await ensureHouseholdUser(ctx, args.memberId);
    const { id, memberId: _memberId, ...updates } = args;
    void _memberId;
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Expense not found");
    }
    const dedupeKey = buildExpenseDedupeKey({
      amount: updates.amount ?? existing.amount,
      description: updates.description ?? existing.description,
      account: updates.account ?? existing.account,
      date: updates.date ?? existing.date,
      type: updates.type ?? existing.type,
    });
    await ctx.db.patch(id, { ...updates, dedupeKey });
    
    return id;
  },
});

// Mutation to delete an expense
export const deleteExpense = mutation({
  args: { id: v.id("expenses"), memberId: v.string() },
  handler: async (ctx, args) => {
    await ensureHouseholdUser(ctx, args.memberId);
    await ctx.db.delete(args.id);
    return true;
  },
});

function getDaysInMonth(month: string) {
  const [yearString, monthString] = month.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString);
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return 31;
  }
  return new Date(year, monthIndex, 0).getDate();
}

type ExpenseFiltersInput = {
  category?: Id<"categories">;
  startDate?: string;
  endDate?: string;
  type?: "income" | "expense";
};

function buildFilteredExpenseQuery(ctx: QueryCtx, filters: ExpenseFiltersInput) {
  let queryBuilder = ctx.db.query("expenses");

  if (filters.category) {
    queryBuilder = queryBuilder.filter((q) => q.eq(q.field("category"), filters.category!));
  }

  if (filters.type) {
    queryBuilder = queryBuilder.filter((q) => q.eq(q.field("type"), filters.type!));
  }

  if (filters.startDate) {
    queryBuilder = queryBuilder.filter((q) => q.gte(q.field("date"), filters.startDate!));
  }

  if (filters.endDate) {
    queryBuilder = queryBuilder.filter((q) => q.lte(q.field("date"), filters.endDate!));
  }

  return queryBuilder.order("desc");
}

async function hydrateExpenses(ctx: QueryCtx, expenses: Array<Doc<"expenses">>) {
  return Promise.all(
    expenses.map(async (expense) => {
      const category = await safeGetDocument(ctx, "categories", expense.category);
      const user = await safeGetDocument(ctx, "users", expense.addedBy);
      return {
        ...expense,
        categoryDetails: category,
        userDetails: user ? { name: user.name, email: user.email } : null,
      };
    })
  );
}

async function safeGetDocument<TableName extends TableNames>(
  ctx: QueryCtx,
  tableName: TableName,
  id?: Id<TableName> | null
): Promise<Doc<TableName> | null> {
  if (!id) {
    return null;
  }

  try {
    return await ctx.db.get(id);
  } catch (error) {
    console.error(`Failed to hydrate ${tableName} ${id}`, error);
    return null;
  }
}

function normalizeLegacyLimit(input?: number) {
  if (typeof input !== "number" || !Number.isFinite(input) || input <= 0) {
    return 50;
  }
  return Math.min(200, Math.max(5, Math.round(input)));
}
