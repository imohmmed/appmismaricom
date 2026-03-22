import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const enrollmentRequestsTable = pgTable("enrollment_requests", {
  id: serial("id").primaryKey(),
  name: text("name"),
  phone: text("phone"),
  udid: text("udid").notNull(),
  deviceType: text("device_type"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EnrollmentRequest = typeof enrollmentRequestsTable.$inferSelect;
