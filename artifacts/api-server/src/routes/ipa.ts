import { Router } from "express";
import AdmZip from "adm-zip";
import plist from "plist";
import axios from "axios";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

async function parseIpaBuffer(buffer: Buffer): Promise<{
  name: string;
  bundleId: string;
  version: string;
  icon: string | null;
  sizeBytes: number;
  size: string;
  minOsVersion: string | null;
  downloadUrl: string | null;
}> {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  const plistEntry = entries.find(e =>
    /^Payload\/[^/]+\.app\/Info\.plist$/.test(e.entryName)
  );

  if (!plistEntry) throw new Error("لم يتم العثور على Info.plist داخل ملف IPA");

  const plistData = plist.parse(plistEntry.getData().toString("utf8")) as Record<string, any>;

  const name: string = plistData["CFBundleDisplayName"] || plistData["CFBundleName"] || "";
  const bundleId: string = plistData["CFBundleIdentifier"] || "";
  const version: string = plistData["CFBundleShortVersionString"] || plistData["CFBundleVersion"] || "";
  const minOsVersion: string | null = plistData["MinimumOSVersion"] || null;

  const appFolder = plistEntry.entryName.replace("/Info.plist", "");

  let iconBase64: string | null = null;

  const iconPriority = [
    "AppIcon60x60@3x.png",
    "AppIcon60x60@2x.png",
    "AppIcon76x76@2x~ipad.png",
    "AppIcon76x76@2x.png",
    "AppIcon57x57@2x.png",
    "Icon-60@2x.png",
    "Icon-60@3x.png",
    "Icon@2x.png",
    "Icon.png",
  ];

  for (const iconName of iconPriority) {
    const iconEntry = entries.find(e => e.entryName === `${appFolder}/${iconName}`);
    if (iconEntry) {
      iconBase64 = `data:image/png;base64,${iconEntry.getData().toString("base64")}`;
      break;
    }
  }

  if (!iconBase64) {
    const anyIconEntry = entries.find(
      e => e.entryName.startsWith(`${appFolder}/AppIcon`) && e.entryName.endsWith(".png")
    );
    if (anyIconEntry) {
      iconBase64 = `data:image/png;base64,${anyIconEntry.getData().toString("base64")}`;
    }
  }

  const sizeBytes = buffer.length;
  const sizeMB = sizeBytes / (1024 * 1024);
  const size = sizeMB < 1 ? `${Math.round(sizeBytes / 1024)} KB` : `${Math.round(sizeMB)} MB`;

  return { name, bundleId, version, icon: iconBase64, sizeBytes, size, minOsVersion, downloadUrl: null };
}

router.post("/admin/ipa/parse-url", async (req, res): Promise<void> => {
  const { url } = req.body;
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "الرابط مطلوب" });
    return;
  }

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 120000,
      maxContentLength: 500 * 1024 * 1024,
    });

    const buffer = Buffer.from(response.data);
    const info = await parseIpaBuffer(buffer);
    res.json({ ...info, downloadUrl: url });
  } catch (err: any) {
    if (err.message?.includes("Info.plist")) {
      res.status(422).json({ error: err.message });
    } else {
      res.status(500).json({ error: `فشل تحليل الملف: ${err.message || "خطأ غير معروف"}` });
    }
  }
});

router.post("/admin/ipa/parse-file", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "الملف مطلوب" });
    return;
  }

  try {
    const info = await parseIpaBuffer(req.file.buffer);
    res.json(info);
  } catch (err: any) {
    res.status(422).json({ error: err.message || "فشل تحليل الملف" });
  }
});

export default router;
