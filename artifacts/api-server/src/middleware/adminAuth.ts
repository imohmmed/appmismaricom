import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || "mismari-admin-jwt-secret-2025-change-in-prod";

export interface AdminJwtPayload {
  adminId: number;
  username: string;
  role: string;
  permissions: string[];
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const token =
    (req.headers["x-admin-token"] as string) ||
    (req.headers["authorization"] as string)?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "غير مصرّح — يرجى تسجيل الدخول" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
    (req as any).admin = payload;
    next();
  } catch {
    res.status(401).json({ error: "انتهت صلاحية الجلسة — يرجى تسجيل الدخول مجدداً" });
  }
}

export function requirePermission(perm: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const admin = (req as any).admin as AdminJwtPayload | undefined;
    if (!admin) { res.status(401).json({ error: "غير مصرّح" }); return; }
    if (admin.role === "superadmin" || admin.permissions.includes(perm)) {
      next();
    } else {
      res.status(403).json({ error: `ليس لديك صلاحية: ${perm}` });
    }
  };
}
