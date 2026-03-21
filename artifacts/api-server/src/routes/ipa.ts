import { Router } from "express";
import plist from "plist";
import multer from "multer";
import AdmZip from "adm-zip";
import { inflateRawSync } from "zlib";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

async function curlFetch(url: string, args: string[] = []): Promise<Buffer> {
  const { stdout } = await execFileAsync("curl", [
    "-L", "-s", "--max-time", "30",
    "--max-filesize", "200000000",
    ...args,
    url,
  ], { encoding: "buffer", maxBuffer: 200 * 1024 * 1024 });
  return Buffer.from(stdout);
}

async function getFileSize(url: string): Promise<number> {
  const { stdout } = await execFileAsync("curl", [
    "-L", "-s", "-I", "--max-time", "15", url,
  ], { encoding: "buffer" });
  const headers = stdout.toString();
  const match = headers.match(/content-length:\s*(\d+)/i);
  if (!match) throw new Error("لا يمكن تحديد حجم الملف");
  return parseInt(match[1], 10);
}

async function fetchRange(url: string, start: number, end: number): Promise<Buffer> {
  return curlFetch(url, ["-H", `Range: bytes=${start}-${end}`]);
}

interface ZipEntry {
  name: string;
  localOffset: number;
  compSize: number;
  uncompSize: number;
  compression: number;
  isZip64: boolean;
  localOffset64?: bigint;
  compSize64?: bigint;
}

function parseCentralDirectory(buf: Buffer, partOffset: number): ZipEntry[] {
  const entries: ZipEntry[] = [];

  let eocdPos = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      eocdPos = i;
      break;
    }
  }
  if (eocdPos === -1) throw new Error("لم يتم العثور على EOCD في الملف");

  const eocd = buf.slice(eocdPos);
  const cdSize = eocd.readUInt32LE(12);
  const cdOffset = eocd.readUInt32LE(16);
  const cdStart = cdOffset - partOffset;

  let pos = cdStart;
  while (pos < cdStart + cdSize && pos < buf.length - 4) {
    if (buf[pos] !== 0x50 || buf[pos + 1] !== 0x4b || buf[pos + 2] !== 0x01 || buf[pos + 3] !== 0x02) break;

    const compression = buf.readUInt16LE(pos + 10);
    const compSize = buf.readUInt32LE(pos + 20);
    const uncompSize = buf.readUInt32LE(pos + 24);
    const fnLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    const localOffset = buf.readUInt32LE(pos + 42);
    const name = buf.slice(pos + 46, pos + 46 + fnLen).toString();

    const isZip64 = localOffset === 0xffffffff || compSize === 0xffffffff;

    const entry: ZipEntry = { name, localOffset, compSize, uncompSize, compression, isZip64 };

    if (isZip64 && extraLen > 0) {
      const extra = buf.slice(pos + 46 + fnLen, pos + 46 + fnLen + extraLen);
      let ep = 0;
      while (ep < extra.length - 4) {
        const tag = extra.readUInt16LE(ep);
        const size = extra.readUInt16LE(ep + 2);
        if (tag === 0x0001) {
          let dp = ep + 4;
          if (uncompSize === 0xffffffff && dp + 8 <= extra.length) { entry.uncompSize = Number(extra.readBigUInt64LE(dp)); dp += 8; }
          if (compSize === 0xffffffff && dp + 8 <= extra.length) { entry.compSize64 = extra.readBigUInt64LE(dp); entry.compSize = Number(entry.compSize64); dp += 8; }
          if (localOffset === 0xffffffff && dp + 8 <= extra.length) { entry.localOffset64 = extra.readBigUInt64LE(dp); entry.localOffset = Number(entry.localOffset64); }
          break;
        }
        ep += 4 + size;
      }
    }

    entries.push(entry);
    pos += 46 + fnLen + extraLen + commentLen;
  }

  return entries;
}

async function extractEntryFromUrl(url: string, entry: ZipEntry): Promise<Buffer> {
  const offset = entry.localOffset;
  const headerBuf = await fetchRange(url, offset, offset + 1024);

  if (headerBuf[0] !== 0x50 || headerBuf[1] !== 0x4b) throw new Error("لم يتم العثور على Local File Header");

  const fnLen = headerBuf.readUInt16LE(26);
  const extraLen = headerBuf.readUInt16LE(28);
  const dataStart = offset + 30 + fnLen + extraLen;
  const dataEnd = dataStart + entry.compSize - 1;

  const compressedData = await fetchRange(url, dataStart, dataEnd);

  if (entry.compression === 0) return compressedData;
  if (entry.compression === 8) return inflateRawSync(compressedData);
  throw new Error(`ضغط غير مدعوم: ${entry.compression}`);
}

async function parseIpaFromUrl(url: string): Promise<{
  name: string;
  bundleId: string;
  version: string;
  icon: string | null;
  sizeBytes: number;
  size: string;
  minOsVersion: string | null;
  downloadUrl: string;
}> {
  const totalSize = await getFileSize(url);
  if (!totalSize) throw new Error("لا يمكن تحديد حجم الملف");

  const tailSize = Math.min(3 * 1024 * 1024, totalSize);
  const tailBuf = await fetchRange(url, totalSize - tailSize, totalSize - 1);

  const entries = parseCentralDirectory(tailBuf, totalSize - tailSize);
  if (!entries.length) throw new Error("لم يتم العثور على ملفات داخل IPA");

  const plistEntry = entries.find(e => /^Payload\/[^/]+\.app\/Info\.plist$/.test(e.name));
  if (!plistEntry) throw new Error("لم يتم العثور على Info.plist");

  const plistBuf = await extractEntryFromUrl(url, plistEntry);
  const plistData = plist.parse(plistBuf.toString("utf8")) as Record<string, any>;

  const name: string = plistData["CFBundleDisplayName"] || plistData["CFBundleName"] || "";
  const bundleId: string = plistData["CFBundleIdentifier"] || "";
  const version: string = plistData["CFBundleShortVersionString"] || plistData["CFBundleVersion"] || "";
  const minOsVersion: string | null = plistData["MinimumOSVersion"] || null;

  const appFolder = plistEntry.name.replace("/Info.plist", "");

  let iconBase64: string | null = null;
  const iconNames = [
    "AppIcon60x60@3x.png", "AppIcon60x60@2x.png", "AppIcon76x76@2x~ipad.png",
    "AppIcon76x76@2x.png", "AppIcon57x57@2x.png", "Icon-60@3x.png", "Icon-60@2x.png",
    "AppIcon.png", "Icon.png",
  ];
  for (const iconName of iconNames) {
    const iconEntry = entries.find(e => e.name === `${appFolder}/${iconName}`);
    if (iconEntry && iconEntry.compSize < 2 * 1024 * 1024) {
      try {
        const iconBuf = await extractEntryFromUrl(url, iconEntry);
        iconBase64 = `data:image/png;base64,${iconBuf.toString("base64")}`;
        break;
      } catch { continue; }
    }
  }

  if (!iconBase64) {
    const anyIcon = entries.find(e => e.name.startsWith(`${appFolder}/AppIcon`) && e.name.endsWith(".png") && e.compSize < 2 * 1024 * 1024);
    if (anyIcon) {
      try {
        const iconBuf = await extractEntryFromUrl(url, anyIcon);
        iconBase64 = `data:image/png;base64,${iconBuf.toString("base64")}`;
      } catch { }
    }
  }

  const sizeMB = totalSize / (1024 * 1024);
  const sizeStr = sizeMB < 1 ? `${Math.round(totalSize / 1024)} KB` : sizeMB < 1024 ? `${Math.round(sizeMB)} MB` : `${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`;

  return { name, bundleId, version, icon: iconBase64, sizeBytes: totalSize, size: sizeStr, minOsVersion, downloadUrl: url };
}

async function parseIpaBuffer(buffer: Buffer): Promise<{
  name: string;
  bundleId: string;
  version: string;
  icon: string | null;
  sizeBytes: number;
  size: string;
  minOsVersion: string | null;
  downloadUrl: null;
}> {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  const plistEntry = entries.find(e => /^Payload\/[^/]+\.app\/Info\.plist$/.test(e.entryName));
  if (!plistEntry) throw new Error("لم يتم العثور على Info.plist داخل ملف IPA");

  const plistData = plist.parse(plistEntry.getData().toString("utf8")) as Record<string, any>;

  const name: string = plistData["CFBundleDisplayName"] || plistData["CFBundleName"] || "";
  const bundleId: string = plistData["CFBundleIdentifier"] || "";
  const version: string = plistData["CFBundleShortVersionString"] || plistData["CFBundleVersion"] || "";
  const minOsVersion: string | null = plistData["MinimumOSVersion"] || null;
  const appFolder = plistEntry.entryName.replace("/Info.plist", "");

  let iconBase64: string | null = null;
  const iconNames = [
    "AppIcon60x60@3x.png", "AppIcon60x60@2x.png", "AppIcon76x76@2x~ipad.png",
    "AppIcon76x76@2x.png", "AppIcon57x57@2x.png", "Icon-60@3x.png", "Icon-60@2x.png",
    "AppIcon.png", "Icon.png",
  ];
  for (const iconName of iconNames) {
    const iconEntry = entries.find(e => e.entryName === `${appFolder}/${iconName}`);
    if (iconEntry) { iconBase64 = `data:image/png;base64,${iconEntry.getData().toString("base64")}`; break; }
  }
  if (!iconBase64) {
    const anyIcon = entries.find(e => e.entryName.startsWith(`${appFolder}/AppIcon`) && e.entryName.endsWith(".png"));
    if (anyIcon) iconBase64 = `data:image/png;base64,${anyIcon.getData().toString("base64")}`;
  }

  const sizeBytes = buffer.length;
  const sizeMB = sizeBytes / (1024 * 1024);
  const size = sizeMB < 1 ? `${Math.round(sizeBytes / 1024)} KB` : `${Math.round(sizeMB)} MB`;

  return { name, bundleId, version, icon: iconBase64, sizeBytes, size, minOsVersion, downloadUrl: null };
}

router.post("/admin/ipa/parse-url", async (req, res): Promise<void> => {
  const { url } = req.body;
  if (!url || typeof url !== "string") { res.status(400).json({ error: "الرابط مطلوب" }); return; }
  if (!url.toLowerCase().endsWith(".ipa")) { res.status(400).json({ error: "الرابط يجب أن ينتهي بـ .ipa" }); return; }

  try {
    const info = await parseIpaFromUrl(url);
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: `فشل تحليل الملف: ${err.message || "خطأ غير معروف"}` });
  }
});

router.post("/admin/ipa/parse-file", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: "الملف مطلوب" }); return; }
  try {
    const info = await parseIpaBuffer(req.file.buffer);
    res.json(info);
  } catch (err: any) {
    res.status(422).json({ error: err.message || "فشل تحليل الملف" });
  }
});

export default router;
