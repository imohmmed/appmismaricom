import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, subscriptionsTable, enrollmentRequestsTable } from "@workspace/db";

const router: IRouter = Router();

function getBaseUrl(req: import("express").Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = (req.headers["x-forwarded-host"] as string) || (req.headers["host"] as string) || "";
  return `${proto}://${host}`;
}

router.get("/profile/enroll", (req, res): void => {
  const base = getBaseUrl(req);
  const callbackUrl = `${base}/api/profile/callback`;

  const profile = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <dict>
    <key>URL</key>
    <string>${callbackUrl}</string>
    <key>DeviceAttributes</key>
    <array>
      <string>UDID</string>
      <string>PRODUCT</string>
      <string>VERSION</string>
      <string>SERIAL</string>
    </array>
  </dict>
  <key>PayloadOrganization</key>
  <string>Mismari</string>
  <key>PayloadDisplayName</key>
  <string>تسجيل جهازك</string>
  <key>PayloadDescription</key>
  <string>يتيح لك هذا الملف تسجيل جهازك للاشتراك في مسماري+</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
  <key>PayloadUUID</key>
  <string>3C4DC7D2-E475-4522-A890-5F7E75D4C6A9</string>
  <key>PayloadIdentifier</key>
  <string>com.mismari.udid-service</string>
  <key>PayloadType</key>
  <string>Profile Service</string>
</dict>
</plist>`;

  res.setHeader("Content-Type", "application/x-apple-aspen-config; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="mismari-enroll.mobileconfig"');
  res.send(profile);
});

router.post(
  "/profile/callback",
  (req, _res, next) => {
    let data = Buffer.alloc(0);
    req.on("data", (chunk: Buffer) => { data = Buffer.concat([data, chunk]); });
    req.on("end", () => { (req as any).rawBody = data; next(); });
  },
  async (req, res): Promise<void> => {
    try {
      const bodyStr = ((req as any).rawBody as Buffer | undefined)?.toString("utf8") || "";
      const udidMatch = bodyStr.match(/<key>UDID<\/key>\s*<string>([A-Fa-f0-9-]+)<\/string>/);
      const udid = udidMatch?.[1]?.trim();

      if (!udid) {
        res.status(400).send("Could not extract UDID from device response");
        return;
      }

      const base = getBaseUrl(req);
      res.redirect(302, `${base}/enroll?udid=${encodeURIComponent(udid)}`);
    } catch (err) {
      console.error("Profile callback error:", err);
      res.status(500).send("Server error");
    }
  }
);

router.get("/enroll/check", async (req, res): Promise<void> => {
  const { udid } = req.query as { udid?: string };
  if (!udid) {
    res.status(400).json({ error: "udid required" });
    return;
  }

  try {
    const [sub] = await db
      .select({
        id: subscriptionsTable.id,
        code: subscriptionsTable.code,
        subscriberName: subscriptionsTable.subscriberName,
        isActive: subscriptionsTable.isActive,
        expiresAt: subscriptionsTable.expiresAt,
      })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.udid, udid))
      .limit(1);

    if (sub) {
      res.json({ found: true, subscriber: sub });
    } else {
      res.json({ found: false });
    }
  } catch (err) {
    console.error("Enroll check error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/enroll/request", async (req, res): Promise<void> => {
  const { name, phone, udid, deviceType, notes } = req.body as {
    name?: string;
    phone?: string;
    udid?: string;
    deviceType?: string;
    notes?: string;
  };

  if (!udid) {
    res.status(400).json({ error: "udid required" });
    return;
  }

  try {
    const [existing] = await db
      .select({ id: enrollmentRequestsTable.id })
      .from(enrollmentRequestsTable)
      .where(eq(enrollmentRequestsTable.udid, udid))
      .limit(1);

    if (existing) {
      res.json({ success: true, message: "request_exists" });
      return;
    }

    await db.insert(enrollmentRequestsTable).values({
      name: name?.trim() || null,
      phone: phone?.trim() || null,
      udid: udid.trim(),
      deviceType: deviceType?.trim() || null,
      notes: notes?.trim() || null,
      status: "pending",
    });

    res.json({ success: true, message: "submitted" });
  } catch (err) {
    console.error("Enroll request error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/admin/enroll-requests", async (req, res): Promise<void> => {
  const token = req.headers["x-admin-token"] as string;
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const requests = await db
      .select()
      .from(enrollmentRequestsTable)
      .orderBy(enrollmentRequestsTable.createdAt);

    res.json({ requests });
  } catch (err) {
    console.error("Admin enroll-requests error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/admin/enroll-requests/:id", async (req, res): Promise<void> => {
  const token = req.headers["x-admin-token"] as string;
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(req.params.id, 10);
  const { status } = req.body as { status?: string };

  try {
    await db
      .update(enrollmentRequestsTable)
      .set({ status: status || "pending" })
      .where(eq(enrollmentRequestsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error("Admin enroll-requests PUT error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/admin/enroll-requests/:id", async (req, res): Promise<void> => {
  const token = req.headers["x-admin-token"] as string;
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(req.params.id, 10);
  try {
    await db.delete(enrollmentRequestsTable).where(eq(enrollmentRequestsTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error("Admin enroll-requests DELETE error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
