import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  Search, RefreshCw, Loader2, CheckSquare, Square,
  Trash2, Clock, CheckCircle2, XCircle, X,
  Smartphone, Tablet, Shield, Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "";
const A = "#9fbcff";

async function adminFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("adminToken") || "";
  const res = await fetch(`${API}/api${path}`, {
    ...opts,
    headers: { ...(opts?.headers || {}), "x-admin-token": token, "Content-Type": "application/json" },
  });
  if (res.status === 204) return null;
  return res.json();
}

interface Sub {
  id: number;
  code: string;
  subscriberName: string | null;
  phone: string | null;
  udid: string | null;
  planNameAr: string | null;
  planName: string | null;
  deviceType: string | null;
  groupName: string | null;
  isActive: string;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface Group {
  id: number;
  certName: string;
  iphoneOfficialCount: number;
  iphoneMacCount: number;
  ipadCount: number;
}

type FilterType = "all" | "active" | "inactive";

function ApproveModal({ sub, onClose, onDone }: { sub: Sub; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>(sub.groupName || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch("/admin/groups").then(data => {
      setGroups(data?.groups || []);
      setLoadingGroups(false);
    });
  }, []);

  const handleApprove = async () => {
    if (!selectedGroup.trim()) { toast({ title: "اختر مجموعة", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await adminFetch(`/admin/subscriptions/${sub.id}`, {
        method: "PUT",
        body: JSON.stringify({ groupName: selectedGroup.trim(), isActive: "true" }),
      });
      toast({ title: "تم قبول الطلب وإضافة المشترك بنجاح" });
      onDone();
      onClose();
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">قبول طلب الاشتراك</h3>
            <p className="text-white/40 text-xs mt-0.5">{sub.subscriberName || sub.code}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-[#111111] rounded-xl p-4 space-y-2 text-sm">
            {sub.subscriberName && <div className="flex justify-between"><span className="text-white/40">الاسم</span><span className="text-white">{sub.subscriberName}</span></div>}
            {sub.phone && <div className="flex justify-between"><span className="text-white/40">الهاتف</span><span className="text-white/80 font-mono">{sub.phone}</span></div>}
            <div className="flex justify-between"><span className="text-white/40">الكود</span><span className="font-mono text-xs" style={{ color: A }}>{sub.code}</span></div>
            {sub.deviceType && <div className="flex justify-between"><span className="text-white/40">الجهاز</span><span className="text-white/80">{sub.deviceType}</span></div>}
            {sub.udid && (
              <div className="flex justify-between items-start gap-2">
                <span className="text-white/40 shrink-0">UDID</span>
                <span className="text-white/60 font-mono text-xs break-all text-left">{sub.udid}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: `${A}99` }}>اختر المجموعة *</label>
            {loadingGroups ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>
            ) : groups.length === 0 ? (
              <div className="py-4 text-center text-white/30 text-sm">لا توجد مجموعات — أضف مجموعة أولاً</div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {groups.map(g => {
                  const iphoneCount = (g.iphoneOfficialCount || 0) + (g.iphoneMacCount || 0);
                  const ipadCount = g.ipadCount || 0;
                  const isSelected = selectedGroup === g.certName;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGroup(g.certName)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-all"
                      style={isSelected
                        ? { background: `${A}15`, borderColor: `${A}40` }
                        : { background: "#111", borderColor: "rgba(255,255,255,0.08)" }
                      }
                    >
                      <Shield className="w-4 h-4 shrink-0" style={{ color: isSelected ? A : "rgba(255,255,255,0.3)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{g.certName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-white/40">
                            <Smartphone className="w-3 h-3" /> {iphoneCount}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-white/40">
                            <Tablet className="w-3 h-3" /> {ipadCount}
                          </span>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: A }} />}
                    </button>
                  );
                })}
              </div>
            )}
            <input
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              placeholder="أو اكتب اسم المجموعة يدوياً..."
              className="mt-2 w-full bg-black border border-white/10 rounded-lg py-2 px-3 text-sm text-white placeholder-white/20 focus:border-[#9fbcff]/40 focus:outline-none"
            />
          </div>
        </div>

        <div className="border-t border-white/5 p-4 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white text-sm">إلغاء</button>
          <button
            onClick={handleApprove}
            disabled={saving || !selectedGroup.trim()}
            className="px-5 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-40 flex items-center gap-1.5"
            style={{ background: A }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            قبول وإضافة
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRequests() {
  const { toast } = useToast();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [approveTarget, setApproveTarget] = useState<Sub | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "500" });
    if (search.trim()) params.set("search", search.trim());
    const d = await adminFetch(`/admin/subscriptions?${params}`);
    setSubs(d?.subscriptions || []);
    setTotal(d?.total || 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search]);

  const filtered = subs.filter(s => {
    if (filter === "active") return s.isActive === "true";
    if (filter === "inactive") return s.isActive !== "true";
    return true;
  });

  const allSelected = filtered.length > 0 && filtered.every(s => selectedIds.has(s.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(s => s.id)));
  };
  const toggle = (id: number) => {
    const n = new Set(selectedIds);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelectedIds(n);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف هذا الطلب؟")) return;
    await adminFetch(`/admin/subscriptions/${id}`, { method: "DELETE" });
    toast({ title: "تم الحذف" });
    fetchData();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`حذف ${selectedIds.size} طلب؟`)) return;
    await adminFetch("/admin/subscriptions/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids: [...selectedIds] }),
    });
    setSelectedIds(new Set());
    toast({ title: `تم حذف ${selectedIds.size} طلب` });
    fetchData();
  };

  const handleToggleActive = async (sub: Sub) => {
    const newActive = sub.isActive === "true" ? "false" : "true";
    await adminFetch(`/admin/subscriptions/${sub.id}`, {
      method: "PUT",
      body: JSON.stringify({ isActive: newActive }),
    });
    toast({ title: newActive === "true" ? "تم تفعيل الاشتراك" : "تم إيقاف الاشتراك" });
    fetchData();
  };

  const activeCount = subs.filter(s => s.isActive === "true").length;
  const inactiveCount = subs.filter(s => s.isActive !== "true").length;

  const copyUdid = (udid: string) => {
    navigator.clipboard.writeText(udid);
    toast({ title: "تم نسخ UDID" });
  };

  return (
    <AdminLayout>
      <div className="space-y-4" dir="rtl">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              placeholder="ابحث بالاسم، الهاتف، الكود، UDID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-lg py-2 pr-10 pl-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#111111] border border-white/10 rounded-lg p-1">
            {(["all", "active", "inactive"] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={filter === f ? { background: A, color: "#000" } : { color: "rgba(255,255,255,0.4)" }}
              >
                {f === "all" ? `الكل (${total})` : f === "active" ? `مفعّل (${activeCount})` : `غير مفعّل (${inactiveCount})`}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" /> حذف ({selectedIds.size})
            </button>
          )}

          <button onClick={fetchData} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#111111] rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-[#0a0a0a] border-b border-white/5">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <button onClick={toggleAll}>
                      {allSelected
                        ? <CheckSquare className="w-4 h-4" style={{ color: A }} />
                        : <Square className="w-4 h-4 text-white/30" />}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40">المشترك</th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40">الكود</th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40">UDID</th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40">الباقة</th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40">الجهاز</th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40">تاريخ الانتهاء</th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40">الحالة</th>
                  <th className="px-3 py-3 text-xs font-medium text-white/40">تاريخ الطلب</th>
                  <th className="px-3 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-10 text-center text-white/40">
                      <Loader2 className="w-5 h-5 animate-spin inline" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-10 text-center text-white/30">لا توجد طلبات</td>
                  </tr>
                ) : filtered.map(sub => (
                  <tr key={sub.id} className="border-b border-white/5 hover:bg-white/[0.02] group">
                    <td className="px-3 py-3">
                      <button onClick={() => toggle(sub.id)}>
                        {selectedIds.has(sub.id)
                          ? <CheckSquare className="w-4 h-4" style={{ color: A }} />
                          : <Square className="w-4 h-4 text-white/30" />}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-white font-medium text-sm whitespace-nowrap">{sub.subscriberName || <span className="text-white/30">—</span>}</p>
                      {sub.phone && <p className="text-white/40 text-xs mt-0.5" dir="ltr">{sub.phone}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <code className="text-xs font-mono font-bold whitespace-nowrap" style={{ color: A }}>{sub.code}</code>
                    </td>
                    <td className="px-3 py-3">
                      {sub.udid ? (
                        <div className="flex items-center gap-1">
                          <span className="text-white/40 text-xs font-mono">{sub.udid.slice(0, 12)}…</span>
                          <button
                            onClick={() => copyUdid(sub.udid!)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-white/30 hover:text-white transition-all"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap" style={{ background: `${A}20`, color: A }}>
                        {sub.planNameAr || sub.planName || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-white/50 text-xs whitespace-nowrap">{sub.deviceType || "—"}</span>
                      {sub.groupName && <p className="text-white/25 text-[10px] mt-0.5 whitespace-nowrap">{sub.groupName}</p>}
                    </td>
                    <td className="px-3 py-3">
                      {sub.expiresAt ? (
                        <span className={`text-xs flex items-center gap-1 whitespace-nowrap ${new Date(sub.expiresAt) < new Date() ? "text-red-400" : "text-green-400"}`}>
                          <Clock className="w-3 h-3" />
                          {new Date(sub.expiresAt).toLocaleDateString("ar-IQ")}
                        </span>
                      ) : (
                        <span className="text-white/25 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleToggleActive(sub)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all whitespace-nowrap ${
                          sub.isActive === "true"
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-white/10 text-white/40 hover:bg-white/15"
                        }`}
                      >
                        {sub.isActive === "true"
                          ? <><CheckCircle2 className="w-3 h-3" /> مفعّل</>
                          : <><XCircle className="w-3 h-3" /> غير مفعّل</>}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-white/40 text-xs whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString("ar-IQ")}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {sub.isActive !== "true" && (
                          <button
                            onClick={() => setApproveTarget(sub)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-black whitespace-nowrap"
                            style={{ background: A }}
                          >
                            <CheckCircle2 className="w-3 h-3" /> قبول
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {approveTarget && (
        <ApproveModal
          sub={approveTarget}
          onClose={() => setApproveTarget(null)}
          onDone={fetchData}
        />
      )}
    </AdminLayout>
  );
}
