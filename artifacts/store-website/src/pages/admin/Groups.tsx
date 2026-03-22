import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Users, Plus, Loader2, RefreshCw, X, Eye, EyeOff,
  ChevronDown, ChevronUp, Smartphone, Key, Mail,
  Shield, Trash2, Edit2, Check, AlertCircle, Clock,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";
const A = "#9fbcff";

async function adminFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("adminToken") || "";
  const res = await fetch(`${API}/api${path}`, {
    headers: { "x-admin-token": token, "Content-Type": "application/json" },
    ...opts,
  });
  return res;
}

interface GroupRecord {
  id: number;
  certName: string;
  issuerId: string;
  keyId: string;
  privateKey: string;
  email: string;
  createdAt: string;
  deviceCount: number;
  pendingCount: number;
}

interface Device {
  id: number;
  code: string;
  udid: string | null;
  phone: string | null;
  subscriberName: string | null;
  deviceType: string | null;
  isActive: string;
  createdAt: string;
}

const LIMIT = 100;

const emptyForm = { certName: "", issuerId: "", keyId: "", privateKey: "", email: "" };

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-white/40 text-xs shrink-0">{label}</span>
      <span className={`text-white/80 text-xs text-left break-all ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}

function DevicesModal({ group, onClose }: { group: GroupRecord; onClose: () => void }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch(`/admin/groups/${group.id}/devices`)
      .then(r => r.json())
      .then(d => { setDevices(d.devices || []); setLoading(false); });
  }, [group.id]);

  const used = devices.length;
  const pct = Math.min(100, Math.round((used / LIMIT) * 100));
  const barColor = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : A;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" dir="rtl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h3 className="text-white font-bold text-sm">{group.certName}</h3>
            <p className="text-white/40 text-xs mt-0.5">قائمة الأجهزة المسجلة</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/50 text-xs">الأجهزة المسجلة</span>
            <span className="text-xs font-bold" style={{ color: barColor }}>
              {used} / {LIMIT}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: barColor }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/30 text-xs">{LIMIT - used} مقعد متاح</span>
            <span className="text-white/30 text-xs">{pct}% مشغول</span>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-white/30" />
            </div>
          ) : devices.length === 0 ? (
            <div className="py-12 text-center">
              <Smartphone className="w-8 h-8 mx-auto mb-2 text-white/20" />
              <p className="text-white/30 text-sm">لا توجد أجهزة في هذه المجموعة</p>
            </div>
          ) : (
            <table className="w-full text-sm text-right">
              <thead className="bg-[#0a0a0a] border-b border-white/5 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-white/40 text-xs font-medium">#</th>
                  <th className="px-4 py-3 text-white/40 text-xs font-medium">المشترك</th>
                  <th className="px-4 py-3 text-white/40 text-xs font-medium">الجهاز</th>
                  <th className="px-4 py-3 text-white/40 text-xs font-medium">الحالة</th>
                  <th className="px-4 py-3 text-white/40 text-xs font-medium">تاريخ الإضافة</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d, i) => (
                  <tr key={d.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-white/30 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-white/80 text-xs font-medium">{d.subscriberName || d.phone || "—"}</div>
                      {d.udid && <div className="text-white/30 text-xs font-mono mt-0.5 truncate max-w-[140px]">{d.udid}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white/50 text-xs">{d.deviceType || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {d.isActive === "true" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400">
                          <Check className="w-3 h-3" /> نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400">
                          <Clock className="w-3 h-3" /> معلق
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs">
                      {new Date(d.createdAt).toLocaleDateString("ar-SA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function AddGroupModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(emptyForm);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setError("");
    if (!form.certName.trim() || !form.issuerId.trim() || !form.keyId.trim() || !form.privateKey.trim()) {
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    setSaving(true);
    const res = await adminFetch("/admin/groups", {
      method: "POST",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "حدث خطأ"); return; }
    onSaved();
    onClose();
  };

  const inputCls = "w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#9fbcff]/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" dir="rtl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h3 className="text-white font-bold text-sm">إضافة مجموعة جديدة</h3>
            <p className="text-white/40 text-xs mt-0.5">شهادة Apple Developer جديدة</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">اسم الشهادة (_id) <span className="text-red-400">*</span></label>
            <input value={form.certName} onChange={set("certName")} className={inputCls}
              placeholder="مثال: G1_Ziad_Cert" />
            <p className="text-white/25 text-xs mt-1">معرف داخلي فريد لتنظيم المشتركين</p>
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Issuer ID <span className="text-red-400">*</span></label>
            <input value={form.issuerId} onChange={set("issuerId")} className={`${inputCls} font-mono text-xs`}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" dir="ltr" />
            <p className="text-white/25 text-xs mt-1">عنوان حساب المطور لدى أبل — لا يتغير</p>
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Key ID <span className="text-red-400">*</span></label>
            <input value={form.keyId} onChange={set("keyId")} className={`${inputCls} font-mono text-xs`}
              placeholder="XXXXXXXXXX" dir="ltr" />
            <p className="text-white/25 text-xs mt-1">معرف المفتاح من موقع Apple Developer</p>
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Private Key (.p8) <span className="text-red-400">*</span></label>
            <div className="relative">
              <textarea
                value={form.privateKey}
                onChange={set("privateKey")}
                rows={showKey ? 6 : 3}
                className={`${inputCls} font-mono text-xs resize-none`}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                dir="ltr"
                style={{ WebkitTextSecurity: showKey ? "none" : "disc" } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute top-2 left-2 p-1 rounded text-white/30 hover:text-white/70 transition-colors"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-white/25 text-xs mt-1">محتوى ملف cert.p8 — يُخزّن مشفراً ولا يظهر لاحقاً</p>
          </div>

          <div>
            <label className="text-white/60 text-xs mb-1.5 block">البريد الإلكتروني</label>
            <input value={form.email} onChange={set("email")} className={inputCls}
              placeholder="dev@example.com" dir="ltr" type="email" />
            <p className="text-white/25 text-xs mt-1">للإشعارات التقنية عند حدوث مشكلة</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/8 flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#0a0a0a] transition-opacity disabled:opacity-50"
            style={{ background: A }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "حفظ المجموعة"}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

function EditGroupModal({ group, onClose, onSaved }: { group: GroupRecord; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    certName: group.certName,
    issuerId: group.issuerId,
    keyId: group.keyId,
    privateKey: "",
    email: group.email,
  });
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setError("");
    setSaving(true);
    const res = await adminFetch(`/admin/groups/${group.id}`, {
      method: "PUT",
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "حدث خطأ"); return; }
    onSaved();
    onClose();
  };

  const inputCls = "w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#9fbcff]/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" dir="rtl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h3 className="text-white font-bold text-sm">تعديل المجموعة</h3>
            <p className="text-white/40 text-xs mt-0.5">{group.certName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">اسم الشهادة (_id)</label>
            <input value={form.certName} onChange={set("certName")} className={inputCls} />
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Issuer ID</label>
            <input value={form.issuerId} onChange={set("issuerId")} className={`${inputCls} font-mono text-xs`} dir="ltr" />
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Key ID</label>
            <input value={form.keyId} onChange={set("keyId")} className={`${inputCls} font-mono text-xs`} dir="ltr" />
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Private Key (.p8) الجديد</label>
            <div className="relative">
              <textarea
                value={form.privateKey}
                onChange={set("privateKey")}
                rows={showKey ? 6 : 3}
                className={`${inputCls} font-mono text-xs resize-none`}
                placeholder="اتركه فارغاً للإبقاء على المفتاح الحالي"
                dir="ltr"
              />
              <button type="button" onClick={() => setShowKey(v => !v)}
                className="absolute top-2 left-2 p-1 rounded text-white/30 hover:text-white/70 transition-colors">
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">البريد الإلكتروني</label>
            <input value={form.email} onChange={set("email")} className={inputCls} dir="ltr" type="email" />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/8 flex gap-3">
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#0a0a0a] transition-opacity disabled:opacity-50"
            style={{ background: A }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "حفظ التعديلات"}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupCard({ group, onDelete, onEdit, onViewDevices }: {
  group: GroupRecord;
  onDelete: () => void;
  onEdit: () => void;
  onViewDevices: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const used = group.deviceCount;
  const pct = Math.min(100, Math.round((used / LIMIT) * 100));
  const barColor = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e";
  const remaining = LIMIT - used;

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف المجموعة "${group.certName}"؟`)) return;
    setDeleting(true);
    await adminFetch(`/admin/groups/${group.id}`, { method: "DELETE" });
    onDelete();
  };

  return (
    <div className="bg-[#111111] border border-white/8 rounded-2xl overflow-hidden" dir="rtl">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${A}15` }}>
              <Shield className="w-5 h-5" style={{ color: A }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm truncate">{group.certName}</h3>
              {group.email && <p className="text-white/30 text-xs truncate mt-0.5">{group.email}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit}
              className="p-1.5 rounded-lg text-white/30 hover:text-[#9fbcff] hover:bg-[#9fbcff]/10 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white/40 text-xs">استخدام الأجهزة</span>
            <span className="text-xs font-mono font-bold" style={{ color: barColor }}>
              {used} / {LIMIT}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: barColor }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-white/25 text-xs">{remaining} مقعد متبقٍ</span>
            <span className="text-white/25 text-xs">{pct}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
            <p className="text-white font-bold text-lg leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>{used}</p>
            <p className="text-white/30 text-xs mt-1">جهاز</p>
          </div>
          <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
            <p className="text-white font-bold text-lg leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>{remaining}</p>
            <p className="text-white/30 text-xs mt-1">متاح</p>
          </div>
          <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
            <p className="font-bold text-lg leading-none" style={{ fontFamily: "Outfit, sans-serif", color: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e" }}>{pct}%</p>
            <p className="text-white/30 text-xs mt-1">مشغول</p>
          </div>
        </div>

        {group.pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2 mb-4">
            <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="text-yellow-400 text-xs">{group.pendingCount} جهاز في انتظار التفعيل</span>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onViewDevices}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ background: `${A}15`, color: A }}>
            <Smartphone className="w-3.5 h-3.5" />
            عرض الأجهزة
          </button>
          <button onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white hover:bg-white/5 transition-colors">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            التفاصيل
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-5 py-4 space-y-0 bg-[#0d0d0d]">
          <h4 className="text-white/50 text-xs font-semibold mb-3 flex items-center gap-2">
            <Key className="w-3.5 h-3.5" />
            المعلومات التقنية
          </h4>
          <InfoRow label="اسم الشهادة" value={group.certName} />
          <InfoRow label="Issuer ID" value={group.issuerId} mono />
          <InfoRow label="Key ID" value={group.keyId} mono />
          <InfoRow label="Private Key" value="••••••••••••••••" mono />
          <InfoRow label="البريد الإلكتروني" value={group.email} />
          <InfoRow label="تاريخ الإضافة" value={new Date(group.createdAt).toLocaleDateString("ar-SA")} />

          <div className="mt-4 pt-3 border-t border-white/5">
            <h4 className="text-white/50 text-xs font-semibold mb-3 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              كيفية الاستخدام
            </h4>
            <div className="space-y-2 text-xs text-white/30 leading-relaxed">
              <p>• يستخدم السيرفر <span className="text-white/50 font-mono">key_id</span> و <span className="text-white/50 font-mono">issuer_id</span> مع المفتاح لتوليد JWT Token.</p>
              <p>• يُرسل طلب GET إلى Apple API لفحص حالة الأجهزة كل 5 دقائق تلقائياً.</p>
              <p>• الأجهزة التي حالتها <span className="text-yellow-400/70 font-mono">PROCESSING</span> ستنتقل لـ <span className="text-green-400/70 font-mono">ENABLED</span> بعد 72 ساعة.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminGroups() {
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editGroup, setEditGroup] = useState<GroupRecord | null>(null);
  const [devicesGroup, setDevicesGroup] = useState<GroupRecord | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    const res = await adminFetch("/admin/groups");
    const d = await res.json();
    setGroups(d?.groups || []);
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  const totalDevices = groups.reduce((s, g) => s + g.deviceCount, 0);
  const totalCapacity = groups.length * LIMIT;
  const totalPending = groups.reduce((s, g) => s + g.pendingCount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">المجموعات</h2>
            <p className="text-white/40 text-xs mt-0.5">إدارة شهادات Apple Developer</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchGroups} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#0a0a0a] transition-opacity hover:opacity-90"
              style={{ background: A }}>
              <Plus className="w-4 h-4" />
              إضافة مجموعة
            </button>
          </div>
        </div>

        {groups.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "إجمالي المجموعات", value: groups.length, color: A },
              { label: "إجمالي الأجهزة", value: totalDevices, color: "#22c55e" },
              { label: "إجمالي الطاقة", value: totalCapacity, color: "#8b5cf6" },
              { label: "انتظار التفعيل", value: totalPending, color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} className="bg-[#111111] border border-white/8 rounded-xl p-4">
                <p className="text-2xl font-black" style={{ fontFamily: "Outfit, sans-serif", color: s.color }}>{s.value}</p>
                <p className="text-white/40 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-white/30" />
          </div>
        ) : groups.length === 0 ? (
          <div className="py-16 text-center bg-[#111111] rounded-2xl border border-white/8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${A}15` }}>
              <Shield className="w-7 h-7" style={{ color: A }} />
            </div>
            <p className="text-white/50 text-sm font-medium mb-1">لا توجد مجموعات بعد</p>
            <p className="text-white/25 text-xs mb-5">أضف شهادة Apple Developer الأولى للبدء</p>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0a0a0a]"
              style={{ background: A }}>
              <Plus className="w-4 h-4" />
              إضافة مجموعة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                onDelete={fetchGroups}
                onEdit={() => setEditGroup(g)}
                onViewDevices={() => setDevicesGroup(g)}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddGroupModal onClose={() => setShowAdd(false)} onSaved={fetchGroups} />
      )}
      {editGroup && (
        <EditGroupModal group={editGroup} onClose={() => setEditGroup(null)} onSaved={fetchGroups} />
      )}
      {devicesGroup && (
        <DevicesModal group={devicesGroup} onClose={() => setDevicesGroup(null)} />
      )}
    </AdminLayout>
  );
}
