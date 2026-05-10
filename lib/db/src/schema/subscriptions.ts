import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const subscriptionPlanEnum = pgEnum("subscription_plan", ["PAY_AS_YOU_GO", "SIX_MONTH"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["ACTIVE", "EXPIRED", "CANCELLED"]);

export const subscriptionsTable = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  plan: subscriptionPlanEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("ACTIVE"),
  submissionsQuota: integer("submissions_quota").notNull(),
  submissionsUsed: integer("submissions_used").notNull().default(0),
  amountUsdCents: integer("amount_usd_cents").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ createdAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
