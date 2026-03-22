/**
 * Apple DevConnect API helper
 * Registers UDIDs with Apple certificates + smart IOS→MAC routing
 */
import jwt from "jsonwebtoken";
import { db, groupsTable, subscriptionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const IPHONE_IOS_LIMIT = 98;
const IPHONE_MAC_LIMIT = 98;
const IPAD_LIMIT = 98;

// ─── Generate Apple JWT ───────────────────────────────────────────────────────
function generateAppleJWT(issuerId: string, keyId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { iss: issuerId, iat: now, exp: now + 1200, aud: "appstoreconnect-v1" },
    privateKey,
    { algorithm: "ES256", header: { alg: "ES256", kid: keyId, typ: "JWT" } as any }
  );
}

// ─── Get live counts from subscriptions table ─────────────────────────────────
async function getLiveCounts(certName: string) {
  const rows = await db
    .select({ platform: subscriptionsTable.applePlatform })
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.groupName, certName));

  return {
    ios:  rows.filter(r => r.platform === "IOS").length,
    mac:  rows.filter(r => r.platform === "MAC").length,
    ipad: rows.filter(r => r.platform === "IPAD_OS").length,
  };
}

// ─── Decide platform: IOS → MAC bypass when full ──────────────────────────────
function decidePlatform(
  deviceType: "iPhone" | "iPad",
  counts: { ios: number; mac: number; ipad: number }
): { platform: string; canRegister: boolean; reason: string } {
  if (deviceType === "iPad") {
    if (counts.ipad < IPAD_LIMIT) {
      return { platform: "IPAD_OS", canRegister: true, reason: `iPad مقعد ${counts.ipad + 1}/${IPAD_LIMIT}` };
    }
    return { platform: "IPAD_OS", canRegister: false, reason: "مواقع iPad ممتلئة (98/98)" };
  }

  // iPhone: IOS first, then MAC bypass
  if (counts.ios < IPHONE_IOS_LIMIT) {
    return { platform: "IOS", canRegister: true, reason: `iPhone IOS مقعد ${counts.ios + 1}/${IPHONE_IOS_LIMIT}` };
  }
  if (counts.mac < IPHONE_MAC_LIMIT) {
    return {
      platform: "MAC",
      canRegister: true,
      reason: `IOS ممتلأت (${IPHONE_IOS_LIMIT}/${IPHONE_IOS_LIMIT}) — تحويل تلقائي لـ MAC bypass مقعد ${counts.mac + 1}/${IPHONE_MAC_LIMIT}`,
    };
  }
  return { platform: "MAC", canRegister: false, reason: `الشهادة ممتلئة للأيفون (${IPHONE_IOS_LIMIT + IPHONE_MAC_LIMIT}/${IPHONE_IOS_LIMIT + IPHONE_MAC_LIMIT})` };
}

// ─── Main: register device with Apple ────────────────────────────────────────
export interface RegisterResult {
  success: boolean;
  platform: string;         // IOS | MAC | IPAD_OS
  appleDeviceId?: string;   // returned by Apple after registration
  appleStatus: string;      // ENABLED | PROCESSING | FAILED (our label)
  message: string;
  isDuplicate?: boolean;
}

export async function registerDeviceWithApple(opts: {
  certName: string;
  udid: string;
  deviceType: "iPhone" | "iPad";
  deviceName?: string;
}): Promise<RegisterResult> {
  const { certName, udid, deviceType, deviceName } = opts;

  // Load group
  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.certName, certName));
  if (!group) return { success: false, platform: "IOS", appleStatus: "FAILED", message: "المجموعة غير موجودة" };

  // Test certificate groups don't call Apple API — just use IOS
  if (group.groupType === "test_certificate") {
    const counts = await getLiveCounts(certName);
    const decision = decidePlatform(deviceType, counts);
    return {
      success: decision.canRegister,
      platform: decision.platform,
      appleStatus: decision.canRegister ? "ENABLED" : "FAILED",
      message: `[شهادة تطوير] ${decision.reason}`,
    };
  }

  // App Store Connect group — call Apple API
  if (!group.issuerId || !group.keyId || !group.privateKey) {
    return { success: false, platform: "IOS", appleStatus: "FAILED", message: "بيانات الشهادة غير مكتملة" };
  }

  try {
    const counts = await getLiveCounts(certName);
    const decision = decidePlatform(deviceType, counts);

    if (!decision.canRegister) {
      return { success: false, platform: decision.platform, appleStatus: "FAILED", message: decision.reason };
    }

    // Apple API uses "IOS" for both iPhone and iPad in DevConnect, "MAC" for Mac bypass
    const appleApiPlatform = decision.platform === "MAC" ? "MAC" : "IOS";
    const devName = deviceName || `Mismari_${decision.platform === "MAC" ? "iPhone_MAC" : deviceType}_${decision.platform === "IOS" ? counts.ios + 1 : decision.platform === "MAC" ? counts.mac + 1 : counts.ipad + 1}`;

    const token = generateAppleJWT(group.issuerId, group.keyId, group.privateKey);

    const appleRes = await fetch("https://api.appstoreconnect.apple.com/v1/devices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "devices",
          attributes: {
            name: devName,
            udid,
            platform: appleApiPlatform,
          },
        },
      }),
    });

    const body = await appleRes.json() as any;

    if (appleRes.ok && body?.data?.id) {
      return {
        success: true,
        platform: decision.platform,
        appleDeviceId: body.data.id,
        appleStatus: body.data.attributes?.status === "ENABLED" ? "ENABLED" : "PROCESSING",
        message: `${decision.reason} — سُجِّل بنجاح في Apple (ID: ${body.data.id})`,
      };
    }

    // Handle already registered (409)
    if (appleRes.status === 409) {
      const errDetail = body?.errors?.[0]?.detail || "";
      const idMatch = errDetail.match(/ID\s+([A-Z0-9]+)/i);
      return {
        success: true,
        isDuplicate: true,
        platform: decision.platform,
        appleDeviceId: idMatch?.[1],
        appleStatus: "ENABLED",
        message: `الجهاز مسجل مسبقاً في Apple — ${decision.reason}`,
      };
    }

    const errMsg = body?.errors?.[0]?.detail || body?.errors?.[0]?.title || JSON.stringify(body);
    return { success: false, platform: decision.platform, appleStatus: "FAILED", message: `Apple API error: ${errMsg}` };

  } catch (err: any) {
    return { success: false, platform: "IOS", appleStatus: "FAILED", message: `خطأ في الاتصال: ${err?.message || err}` };
  }
}
