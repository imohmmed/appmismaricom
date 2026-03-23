import { db, subscriptionsTable, appsTable, categoriesTable, notificationsTable } from "@workspace/db";
import { eq, and, isNotNull } from "drizzle-orm";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
  data?: Record<string, unknown>;
  image?: string;
}

async function sendToExpo(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const chunks: PushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
    } catch (err) {
      console.error("[push] Failed to send batch:", err);
    }
  }
}

export async function notifyAppAdded(appId: number): Promise<void> {
  try {
    const [appRow] = await db
      .select({
        name: appsTable.name,
        icon: appsTable.icon,
        iconPath: appsTable.iconPath,
        categoryId: appsTable.categoryId,
        categoryName: categoriesTable.name,
        categoryNameAr: categoriesTable.nameAr,
      })
      .from(appsTable)
      .leftJoin(categoriesTable, eq(appsTable.categoryId, categoriesTable.id))
      .where(eq(appsTable.id, appId));

    if (!appRow) return;

    const catNameAr = appRow.categoryNameAr || appRow.categoryName || "";
    const title = appRow.name;
    const body = `✨ تم إضافة تطبيق ${appRow.name} في قسم ${catNameAr}`;
    const iconPath = appRow.iconPath || null;

    // Save to DB so mobile app can fetch even without push
    await db.insert(notificationsTable).values({
      type: "app_added",
      title,
      body,
      target: "all",
      appId,
      appIcon: iconPath,
      recipientCount: 0,
    });

    const tokens = await db
      .select({ pushToken: subscriptionsTable.pushToken })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.isActive, "true"),
          isNotNull(subscriptionsTable.pushToken)
        )
      );

    if (tokens.length === 0) return;

    const messages: PushMessage[] = tokens
      .filter((t) => t.pushToken?.startsWith("ExponentPushToken"))
      .map((t) => ({
        to: t.pushToken!,
        title,
        body,
        sound: "default" as const,
        data: { type: "app_added", appId, appIcon: iconPath },
        ...(appRow.icon ? { image: appRow.icon } : {}),
      }));

    await sendToExpo(messages);
    console.log(`[push] Sent app_added for "${appRow.name}" to ${messages.length} devices`);
  } catch (err) {
    console.error("[push] notifyAppAdded error:", err);
  }
}

export async function sendBroadcast(title: string, body: string, data?: Record<string, unknown>): Promise<number> {
  try {
    const tokens = await db
      .select({ pushToken: subscriptionsTable.pushToken })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.isActive, "true"),
          isNotNull(subscriptionsTable.pushToken)
        )
      );

    const messages: PushMessage[] = tokens
      .filter((t) => t.pushToken?.startsWith("ExponentPushToken"))
      .map((t) => ({
        to: t.pushToken!,
        title,
        body,
        sound: "default" as const,
        data: data || {},
      }));

    await sendToExpo(messages);
    console.log(`[push] Broadcast "${title}" sent to ${messages.length} devices`);
    return messages.length;
  } catch (err) {
    console.error("[push] sendBroadcast error:", err);
    return 0;
  }
}

export async function sendBroadcastToGroup(groupName: string, title: string, body: string, data?: Record<string, unknown>): Promise<number> {
  try {
    const tokens = await db
      .select({ pushToken: subscriptionsTable.pushToken })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.isActive, "true"),
          eq(subscriptionsTable.groupName, groupName),
          isNotNull(subscriptionsTable.pushToken)
        )
      );

    const messages: PushMessage[] = tokens
      .filter((t) => t.pushToken?.startsWith("ExponentPushToken"))
      .map((t) => ({
        to: t.pushToken!,
        title,
        body,
        sound: "default" as const,
        data: data || {},
      }));

    await sendToExpo(messages);
    console.log(`[push] Group broadcast "${title}" → group "${groupName}" sent to ${messages.length} devices`);
    return messages.length;
  } catch (err) {
    console.error("[push] sendBroadcastToGroup error:", err);
    return 0;
  }
}

export async function notifyAppUpdated(appId: number): Promise<void> {
  try {
    const [appRow] = await db
      .select({
        name: appsTable.name,
        icon: appsTable.icon,
        iconPath: appsTable.iconPath,
        categoryId: appsTable.categoryId,
        categoryName: categoriesTable.name,
        categoryNameAr: categoriesTable.nameAr,
      })
      .from(appsTable)
      .leftJoin(categoriesTable, eq(appsTable.categoryId, categoriesTable.id))
      .where(eq(appsTable.id, appId));

    if (!appRow) return;

    const catNameAr = appRow.categoryNameAr || appRow.categoryName || "";
    const title = appRow.name;
    const body = `🔄 تم تحديث تطبيق ${appRow.name} في قسم ${catNameAr}`;
    const iconPath = appRow.iconPath || null;

    // Save to DB so mobile app can fetch even without push
    await db.insert(notificationsTable).values({
      type: "app_updated",
      title,
      body,
      target: "all",
      appId,
      appIcon: iconPath,
      recipientCount: 0,
    });

    const tokens = await db
      .select({ pushToken: subscriptionsTable.pushToken })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.isActive, "true"),
          isNotNull(subscriptionsTable.pushToken)
        )
      );

    if (tokens.length === 0) return;

    const messages: PushMessage[] = tokens
      .filter((t) => t.pushToken?.startsWith("ExponentPushToken"))
      .map((t) => ({
        to: t.pushToken!,
        title,
        body,
        sound: "default" as const,
        data: { type: "app_updated", appId, appIcon: iconPath },
        ...(appRow.icon ? { image: appRow.icon } : {}),
      }));

    await sendToExpo(messages);
    console.log(`[push] Sent app_updated for "${appRow.name}" to ${messages.length} devices`);
  } catch (err) {
    console.error("[push] notifyAppUpdated error:", err);
  }
}
