import { pgTable, text, integer, timestamp, pgEnum, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { papersTable } from "./papers";

export const decisionEnum = pgEnum("decision", ["APPROVED", "REJECTED", "REVISION"]);

export const reviewsTable = pgTable("reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  paperId: integer("paper_id")
    .notNull()
    .references(() => papersTable.id),
  reviewerId: integer("reviewer_id")
    .notNull()
    .references(() => usersTable.id),
  layer: integer("layer").notNull(),
  decision: decisionEnum("decision").notNull(),
  comments: text("comments").notNull(),
  inlineNotes: json("inline_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
