import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("broadcast"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  target: text("target").notNull().default("all"),
  appId: integer("app_id"),
  appIcon: text("app_icon"),
  recipientCount: integer("recipient_count").notNull().default(0),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
export type InsertNotification = typeof notificationsTable.$inferInsert;
