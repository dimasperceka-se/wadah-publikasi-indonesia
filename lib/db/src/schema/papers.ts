import { pgTable, text, integer, timestamp, pgEnum, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const paperStatusEnum = pgEnum("paper_status", [
  "DRAFT",
  "SUBMITTED",
  "AI_REVIEW",
  "AI_PASSED",
  "AI_FAILED",
  "LAYER_2_REVIEW",
  "LAYER_2_APPROVED",
  "LAYER_3_REVIEW",
  "LAYER_3_APPROVED",
  "PUBLISHED",
  "REVISION_REQUESTED",
  "REJECTED",
]);

export const papersTable = pgTable("papers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  abstract: text("abstract").notNull(),
  keywords: text("keywords").array().notNull().default([]),
  category: text("category").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  content: text("content").notNull().default(""),
  coAuthors: text("co_authors").array().notNull().default([]),
  authorId: integer("author_id")
    .notNull()
    .references(() => usersTable.id),
  assignedVerifierId: integer("assigned_verifier_id").references(() => usersTable.id),
  status: paperStatusEnum("status").notNull().default("DRAFT"),
  currentLayer: integer("current_layer").notNull().default(0),
  doi: text("doi").unique(),
  aiReport: json("ai_report"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPaperSchema = createInsertSchema(papersTable).omit({ createdAt: true, updatedAt: true });
export type InsertPaper = z.infer<typeof insertPaperSchema>;
export type Paper = typeof papersTable.$inferSelect;
