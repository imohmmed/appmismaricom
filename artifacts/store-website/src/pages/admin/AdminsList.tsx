import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Shield, ShieldCheck, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "";

const ALL_PERMISSIONS = [
  { key: "apps",          label: "التطبيقات" },
  { key: "categories",    label: "الأقسام" },
  { key: "subscribers",   label: "المشتركين" },
  { key: "groups",        label: "المجموعات" },
  { key: "packages",      label: "الباقات" },
  { key: "featured",      label: "المميّز" },
  { key: "settings",      label: "الإعدادات" },
  { key: "notifications", label: "الإشعارات" },
  { key: "requests",      label: "الطلبات" },
  { key: "admins",        label: "الأدمنية" },
];

interface Admin {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface AdminForm {
  username: string;
  email: string;
  password: string;
  role: "admin" | "superadmin";
  permissions: string[];
  isActive: boolean;
}

const defaultForm = (): AdminForm => ({
  username: "", email: "", password: "", role: "admin", permissions: [], isActive: true,
});

function adminFetch(url: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("adminToken") || "";
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-admin-token": token, ...opts.headers },
  });
}

export default function AdminsList() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminForm>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const selfUsername = localStorage.getItem("adminUsername") || "";
  const selfRole = localStorage.getItem("adminRole") || "";

  const load = async () => {
    try {
      const res = await adminFetch(`${API}/api/admin/admins`);
      if (res.status === 403) {
        toast({ title: "هذه الصفحة للمسؤول الأعلى فقط", variant: "destructive" });
        setLoading(false); return;
      }
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch {
      toast({ title: "فشل تحميل قائمة المسؤولين", variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(defaultForm()); setEditId(null); setShowModal(true); };
  const openEdit = (a: Admin) => {
    setForm({
      username: a.username,
      email: a.email,
      password: "",
      role: a.role as any,
      permissions: JSON.parse(a.permissions || "[]"),
      isActive: a.isActive,
    });
    setEditId(a.id);
    setShowModal(true);
  };

  const togglePerm = (key: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key],
    }));
  };

  const handleSave = async () => {
    if (!editId && (!form.username.trim() || !form.password.trim())) {
      toast({ title: "اسم المستخدم وكلمة المرور مطلوبان", variant: "destructive" }); return;
    }
    if (!editId && form.password.length < 8) {
      toast({ title: "كلمة المرور: 8 أحرف على الأقل", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const body: any = { email: form.email, role: form.role, permissions: form.permissions, isActive: form.isActive };
      if (!editId) { body.username = form.username; body.password = form.password; }
      else if (form.password.trim()) { body.password = form.password; }

      const url = editId ? `${API}/api/admin/admins/${editId}` : `${API}/api/admin/admins`;
      const method = editId ? "PUT" : "POST";
      const res = await adminFetch(url, { method, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) { toast({ title: data.error || "فشل الحفظ", variant: "destructive" }); return; }
      toast({ title: editId ? "تم تحديث المسؤول" : "تمت إضافة المسؤول" });
      setShowModal(false);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await adminFetch(`${API}/api/admin/admins/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error || "فشل الحذف", variant: "destructive" }); return; }
      toast({ title: "تم حذف المسؤول" });
      setDeleteId(null);
      load();
    } catch { toast({ title: "خطأ في الحذف", variant: "destructive" }); }
  };

  if (selfRole !== "superadmin") {
    return (
      <div className="p-8 text-center text-white/40">
        هذه الصفحة متاحة للمسؤول الأعلى (superadmin) فقط.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">الأدمنية</h1>
          <p className="text-white/40 text-sm mt-1">إدارة المسؤولين وصلاحياتهم</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#9fbcff] text-black text-sm font-bold rounded-xl hover:bg-[#7da5ff] transition-all"
        >
          <Plus className="w-4 h-4" /> إضافة مسؤول
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-white/40">جاري التحميل...</div>
      ) : (
        <div className="grid gap-3">
          {admins.map(admin => {
            const perms: string[] = JSON.parse(admin.permissions || "[]");
            const isSuperadmin = admin.role === "superadmin";
            const isSelf = admin.username === selfUsername;
            return (
              <div
                key={admin.id}
                className="bg-[#111] border border-white/8 rounded-2xl p-5 flex items-start gap-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSuperadmin ? "bg-[#9fbcff]/20" : "bg-white/5"}`}>
                  {isSuperadmin
                    ? <ShieldCheck className="w-5 h-5 text-[#9fbcff]" />
                    : <Shield className="w-5 h-5 text-white/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{admin.username}</span>
                    {isSelf && <span className="text-xs px-2 py-0.5 bg-[#9fbcff]/15 text-[#9fbcff] rounded-full">أنت</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isSuperadmin ? "bg-[#9fbcff]/15 text-[#9fbcff]" : "bg-white/8 text-white/50"}`}>
                      {isSuperadmin ? "مسؤول أعلى" : "مسؤول"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${admin.isActive ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                      {admin.isActive ? "نشط" : "موقوف"}
                    </span>
                  </div>
                  {admin.email && <p className="text-white/40 text-xs mt-0.5">{admin.email}</p>}
                  {!isSuperadmin && perms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {perms.map(p => {
                        const label = ALL_PERMISSIONS.find(x => x.key === p)?.label || p;
                        return <span key={p} className="text-xs px-1.5 py-0.5 bg-white/5 text-white/40 rounded">{label}</span>;
                      })}
                    </div>
                  )}
                  {admin.lastLoginAt && (
                    <p className="text-white/25 text-xs mt-1.5">
                      آخر دخول: {new Date(admin.lastLoginAt).toLocaleString("ar")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(admin)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <Edit2 className="w-4 h-4 text-white/50" />
                  </button>
                  {!isSelf && (
                    <button
                      onClick={() => setDeleteId(admin.id)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {admins.length === 0 && (
            <div className="text-center py-16 text-white/30">لا يوجد مسؤولون</div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">{editId ? "تعديل مسؤول" : "إضافة مسؤول"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            <div className="space-y-3">
              {!editId && (
                <div>
                  <label className="text-xs text-white/50 mb-1 block">اسم المستخدم *</label>
                  <input
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#9fbcff]/50 transition-all"
                    dir="ltr"
                    placeholder="username"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-white/50 mb-1 block">البريد الإلكتروني</label>
                <input
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#9fbcff]/50 transition-all"
                  dir="ltr"
                  type="email"
                  placeholder="admin@mismari.com"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">
                  {editId ? "كلمة مرور جديدة (اتركها فارغة للإبقاء)" : "كلمة المرور * (8 أحرف على الأقل)"}
                </label>
                <input
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  type="password"
                  className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#9fbcff]/50 transition-all"
                  dir="ltr"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">الدور</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
                  className="w-full bg-black border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#9fbcff]/50 transition-all"
                >
                  <option value="admin">مسؤول (admin)</option>
                  <option value="superadmin">مسؤول أعلى (superadmin)</option>
                </select>
              </div>

              {form.role !== "superadmin" && (
                <div>
                  <label className="text-xs text-white/50 mb-2 block">الصلاحيات</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.map(p => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => togglePerm(p.key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all ${
                          form.permissions.includes(p.key)
                            ? "bg-[#9fbcff]/15 border-[#9fbcff]/40 text-[#9fbcff]"
                            : "bg-white/3 border-white/8 text-white/40 hover:bg-white/6"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 ${form.permissions.includes(p.key) ? "bg-[#9fbcff]" : "bg-white/10"}`}>
                          {form.permissions.includes(p.key) && <Check className="w-2.5 h-2.5 text-black" />}
                        </div>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`w-10 h-6 rounded-full transition-all relative ${form.isActive ? "bg-[#9fbcff]" : "bg-white/15"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.isActive ? "right-1" : "left-1"}`} />
                </button>
                <span className="text-sm text-white/60">{form.isActive ? "حساب نشط" : "حساب موقوف"}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#9fbcff] text-black text-sm font-bold hover:bg-[#7da5ff] transition-all disabled:opacity-50"
              >
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
            <div className="w-12 h-12 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">حذف المسؤول</h3>
              <p className="text-white/40 text-sm mt-1">هذا الإجراء لا يمكن التراجع عنه</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

