import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { papersTable } from "./papers";

export const statusHistoryTable = pgTable("status_history", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  paperId: integer("paper_id")
    .notNull()
    .references(() => papersTable.id),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  changedBy: text("changed_by").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStatusHistorySchema = createInsertSchema(statusHistoryTable).omit({ createdAt: true });
export type InsertStatusHistory = z.infer<typeof insertStatusHistorySchema>;
export type StatusHistory = typeof statusHistoryTable.$inferSelect;
