import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { appsTable } from "./apps";
import { subscriptionsTable } from "./subscriptions";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  appId: integer("app_id").notNull().references(() => appsTable.id, { onDelete: "cascade" }),
  subscriptionId: integer("subscription_id").references(() => subscriptionsTable.id, { onDelete: "set null" }),
  subscriberName: text("subscriber_name"),
  phone: text("phone"),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  isHidden: boolean("is_hidden").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
