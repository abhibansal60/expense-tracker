import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ensureHouseholdUser } from "./householdUser";
import { buildExpenseDedupeKey } from "./expenses";

export const listRecurringEntries = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query("recurringEntries").order("asc").collect();

    return Promise.all(
      entries.map(async (entry) => {
        const category = await ctx.db.get(entry.category);
        return {
          ...entry,
          categoryName: category?.name ?? "Unknown",
          nextOccurrence: getNextOccurrence(entry),
        };
      })
    );
  },
});

export const createRecurringEntry = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    category: v.id("categories"),
    account: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    dayOfMonth: v.number(),
    startMonth: v.string(),
    endMonth: v.optional(v.string()),
    memberId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ensureHouseholdUser(ctx, args.memberId);
    const normalizedDay = clampDay(args.dayOfMonth);

    return await ctx.db.insert("recurringEntries", {
      amount: args.amount,
      description: args.description.trim(),
      category: args.category,
      account: args.account,
      type: args.type,
      dayOfMonth: normalizedDay,
      startMonth: args.startMonth,
      endMonth: args.endMonth,
      createdBy: user._id,
      createdAt: Date.now(),
    });
  },
});

export const deleteRecurringEntry = mutation({
  args: { id: v.id("recurringEntries"), memberId: v.string() },
  handler: async (ctx, args) => {
    await ensureHouseholdUser(ctx, args.memberId);
    await ctx.db.delete(args.id);
    return true;
  },
});

export const processRecurringEntries = mutation({
  args: {
    month: v.string(),
    memberId: v.string(),
  },
  handler: async (ctx, args) => {
    await ensureHouseholdUser(ctx, args.memberId);
    const entries = await ctx.db.query("recurringEntries").collect();
    let created = 0;

    for (const entry of entries) {
      if (!isMonthActive(entry.startMonth, entry.endMonth, args.month)) {
        continue;
      }

      const chargeDate = buildChargeDate(args.month, entry.dayOfMonth);
      const dedupeKey = buildExpenseDedupeKey({
        amount: entry.amount,
        description: `${entry.description}-recurring`,
        account: entry.account,
        date: chargeDate,
        type: entry.type,
      });

      const duplicate = await ctx.db
        .query("expenses")
        .withIndex("by_dedupe_key", (q) => q.eq("dedupeKey", dedupeKey))
        .unique();
      if (duplicate) {
        continue;
      }

      await ctx.db.insert("expenses", {
        amount: entry.amount,
        description: entry.description,
        category: entry.category,
        account: entry.account,
        date: chargeDate,
        type: entry.type,
        source: "manual",
        addedBy: entry.createdBy,
        createdAt: Date.now(),
        dedupeKey,
        recurringEntry: entry._id,
      });
      created += 1;
    }

    return { created };
  },
});

function clampDay(day: number) {
  if (!Number.isFinite(day)) {
    return 1;
  }
  return Math.min(31, Math.max(1, Math.round(day)));
}

function isMonthActive(start: string, end: string | undefined, target: string) {
  if (compareMonths(target, start) < 0) {
    return false;
  }
  if (end && compareMonths(target, end) > 0) {
    return false;
  }
  return true;
}

function compareMonths(a: string, b: string) {
  return a.localeCompare(b);
}

function buildChargeDate(month: string, day: number) {
  const daysInMonth = getDaysInMonth(month);
  const actualDay = Math.min(daysInMonth, clampDay(day));
  return `${month}-${String(actualDay).padStart(2, "0")}`;
}

function getDaysInMonth(month: string) {
  const [yearString, monthString] = month.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString);
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return 31;
  }
  return new Date(year, monthIndex, 0).getDate();
}

function getNextOccurrence(entry: {
  startMonth: string;
  endMonth?: string;
  dayOfMonth: number;
}) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const candidates: string[] = [];

  for (let offset = 0; offset < 6; offset++) {
    const future = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const month = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}`;
    if (isMonthActive(entry.startMonth, entry.endMonth, month)) {
      candidates.push(month);
    }
  }

  const next = candidates.length > 0 ? candidates[0] : entry.endMonth ?? currentMonth;
  return buildChargeDate(next, entry.dayOfMonth);
}
