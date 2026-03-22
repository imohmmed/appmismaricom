import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const groupsTable = pgTable("groups", {
  id: serial("id").primaryKey(),
  certName: text("cert_name").notNull().unique(),
  issuerId: text("issuer_id").notNull(),
  keyId: text("key_id").notNull(),
  privateKey: text("private_key").notNull(),
  email: text("email").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Group = typeof groupsTable.$inferSelect;
export type InsertGroup = typeof groupsTable.$inferInsert;
