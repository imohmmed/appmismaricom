import { useState, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminListApps, useAdminCreateApp, useAdminUpdateApp, useAdminDeleteApp, useAdminListCategories, getAdminListAppsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, X, Upload, Link2, MoreVertical,
  Copy, Edit2, EyeOff, FlaskConical, Trash2, CheckSquare, Square,
  Loader2, AlertCircle, CheckCircle2, RefreshCw, FileArchive, Globe, Bell, Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { App } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const VITE_API = import.meta.env.VITE_API_URL || "";

async function callApi(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("adminToken") || "";
  const res = await fetch(`${VITE_API}/api${path}`, {
    ...opts,
    headers: { ...(opts?.headers || {}), "x-admin-token": token },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "خطأ غير معروف");
  return json;
}

const REPLACE_MODES = [
  { value: "by_bundle", label: "تحديث واستبدال التطبيق عبر بندل التطبيق" },
  { value: "by_name", label: "تحديث واستبدال التطبيق عبر اسم التطبيق" },
  { value: "by_filename", label: "تحديث واستبدال التطبيق عبر اسم ملف التطبيق" },
  { value: "new_version", label: "رفع وتحديث التطبيق دون استبدال النسخ السابقة" },
];

const ACCENT = "#9fbcff";

interface ParsedIpa {
  name: string;
  bundleId: string;
  version: string;
  icon: string | null;
  size: string;
  minOsVersion: string | null;
  downloadUrl: string | null;
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium" style={{ color: `${ACCENT}99` }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn("w-full bg-black border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:border-[#9fbcff]/50 focus:outline-none placeholder-white/20", props.className)}
    />
  );
}

function Select({ ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full bg-black border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:border-[#9fbcff]/50 focus:outline-none appearance-none"
    />
  );
}

function IpaImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { data: catData } = useAdminListCategories();
  const categories = catData?.categories || [];
  const createMutation = useAdminCreateApp();
  const { toast } = useToast();

  const [step, setStep] = useState<"source" | "parsing" | "form">("source");
  const [sourceMode, setSourceMode] = useState<"url" | "file">("url");
  const [urlInput, setUrlInput] = useState("");
  const [parseError, setParseError] = useState("");
  const [parsed, setParsed] = useState<ParsedIpa | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", bundleId: "", version: "", size: "", icon: "",
    description: "", downloadUrl: "",
    categoryId: 1, status: "active",
    replaceMode: "by_bundle",
    notify: false,
    isFeatured: false, isHot: false,
    minOsVersion: "",
  });

  const applyParsed = (p: ParsedIpa, sourceUrl?: string) => {
    setParsed(p);
    setForm(f => ({
      ...f,
      name: p.name || f.name,
      bundleId: p.bundleId || f.bundleId,
      version: p.version || f.version,
      size: p.size || f.size,
      icon: p.icon || f.icon,
      downloadUrl: sourceUrl || p.downloadUrl || f.downloadUrl,
      minOsVersion: p.minOsVersion || f.minOsVersion,
    }));
    setStep("form");
  };

  const handleParseUrl = async () => {
    if (!urlInput.trim()) return;
    setStep("parsing");
    setParseError("");
    try {
      const result = await callApi("/admin/ipa/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      applyParsed(result, urlInput.trim());
    } catch (err: any) {
      setParseError(err.message || "فشل تحليل الرابط");
      setStep("source");
    }
  };

  const handleParseFile = async (file: File) => {
    setStep("parsing");
    setParseError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const result = await callApi("/admin/ipa/parse-file", { method: "POST", body: fd });
      applyParsed(result);
    } catch (err: any) {
      setParseError(err.message || "فشل قراءة الملف");
      setStep("source");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          name: form.name,
          description: form.description,
          icon: form.icon,
          categoryId: form.categoryId,
          tag: "new" as any,
          version: form.version,
          size: form.size,
          bundleId: form.bundleId,
          isFeatured: form.isFeatured,
          isHot: form.isHot,
        },
      });
      toast({ title: "تمت إضافة التطبيق بنجاح" });
      onDone();
    } catch {
      toast({ title: "حدث خطأ أثناء الإضافة", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm" dir="rtl">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">
              {step === "form" ? "إضافة تطبيق" : "استيراد ملف IPA"}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: `${ACCENT}70` }}>
              {step === "source" && "اختر مصدر الملف"}
              {step === "parsing" && "جاري تحليل الملف..."}
              {step === "form" && "أكمل بيانات التطبيق"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {step === "source" && (
            <div className="p-5 space-y-5">
              <div className="flex rounded-xl border border-white/10 overflow-hidden">
                {(["url", "file"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSourceMode(m)}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all", sourceMode === m ? "text-white" : "text-white/30 hover:text-white/60")}
                    style={sourceMode === m ? { background: `${ACCENT}15`, color: ACCENT } : {}}
                  >
                    {m === "url" ? <><Globe className="w-4 h-4" /> عبر رابط</> : <><FileArchive className="w-4 h-4" /> رفع ملف</>}
                  </button>
                ))}
              </div>

              {sourceMode === "url" ? (
                <div className="space-y-3">
                  <FieldGroup label="رابط ملف IPA المباشر">
                    <Input
                      dir="ltr"
                      placeholder="https://example.com/app.ipa"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleParseUrl()}
                    />
                  </FieldGroup>
                  {parseError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{parseError}</span>
                    </div>
                  )}
                  <button
                    onClick={handleParseUrl}
                    disabled={!urlInput.trim()}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
                    style={{ background: ACCENT }}
                  >
                    تحليل الرابط واستخراج البيانات
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input ref={fileInputRef} type="file" accept=".ipa" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleParseFile(f); }} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-white/10 rounded-xl p-10 text-center hover:border-white/20 transition-colors"
                  >
                    <FileArchive className="w-8 h-8 mx-auto mb-3" style={{ color: ACCENT }} />
                    <p className="text-sm font-medium text-white">اسحب ملف IPA هنا أو اضغط للاختيار</p>
                    <p className="text-xs text-white/30 mt-1">الحد الأقصى: 500 MB</p>
                  </button>
                  {parseError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{parseError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === "parsing" && (
            <div className="p-16 flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: ACCENT }} />
              <div>
                <p className="text-white font-medium">جاري فك ضغط وتحليل الملف...</p>
                <p className="text-white/30 text-xs mt-1">يتم استخراج الاسم والأيقونة والبندل تلقائياً</p>
              </div>
            </div>
          )}

          {step === "form" && (
            <form id="app-form" onSubmit={handleSubmit} className="p-5 space-y-4">
              {parsed && (
                <div className="flex items-center gap-4 p-3 rounded-xl border border-white/10 bg-white/3">
                  {parsed.icon ? (
                    <img src={parsed.icon} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <FileArchive className="w-6 h-6 text-white/30" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{parsed.name || "—"}</p>
                    <p className="text-xs text-white/40 mt-0.5 font-mono truncate">{parsed.bundleId}</p>
                    <div className="flex gap-3 mt-1">
                      {parsed.version && <span className="text-xs" style={{ color: ACCENT }}>v{parsed.version}</span>}
                      {parsed.size && <span className="text-xs text-white/30">{parsed.size}</span>}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <FieldGroup label="اسم التطبيق">
                    <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم التطبيق" />
                  </FieldGroup>
                </div>
                <FieldGroup label="Bundle ID">
                  <Input dir="ltr" value={form.bundleId} onChange={e => setForm({ ...form, bundleId: e.target.value })} placeholder="com.example.app" />
                </FieldGroup>
                <FieldGroup label="الإصدار">
                  <Input dir="ltr" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="1.0.0" />
                </FieldGroup>
                <FieldGroup label="التصنيف">
                  <Select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: Number(e.target.value) })}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    {categories.length === 0 && <option value={1}>تطبيقات بلس</option>}
                  </Select>
                </FieldGroup>
                <FieldGroup label="الحالة">
                  <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">نشط</option>
                    <option value="hidden">مخفي</option>
                    <option value="test">وضع تجريبي</option>
                  </Select>
                </FieldGroup>
                <div className="col-span-2">
                  <FieldGroup label="رابط التحميل (IPA)">
                    <Input dir="ltr" value={form.downloadUrl} onChange={e => setForm({ ...form, downloadUrl: e.target.value })} placeholder="https://..." />
                  </FieldGroup>
                </div>
                <div className="col-span-2">
                  <FieldGroup label="رابط الأيقونة">
                    <Input dir="ltr" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="أدخل رابطاً للأيقونة أو تُستخرج تلقائياً" />
                  </FieldGroup>
                </div>
                <div className="col-span-2">
                  <FieldGroup label="الوصف">
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-lg py-2 px-3 text-sm text-white h-16 focus:border-[#9fbcff]/50 focus:outline-none placeholder-white/20"
                      placeholder="وصف اختياري..."
                    />
                  </FieldGroup>
                </div>

                <div className="col-span-2 border-t border-white/5 pt-3">
                  <FieldGroup label="طريقة التحديث والاستبدال">
                    <div className="grid grid-cols-1 gap-1.5">
                      {REPLACE_MODES.map(m => (
                        <label key={m.value} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm", form.replaceMode === m.value ? "border-white/20 text-white" : "border-white/5 text-white/40 hover:border-white/10")} style={form.replaceMode === m.value ? { background: `${ACCENT}10`, color: ACCENT, borderColor: `${ACCENT}30` } : {}}>
                          <input type="radio" name="replaceMode" value={m.value} checked={form.replaceMode === m.value} onChange={() => setForm({ ...form, replaceMode: m.value })} className="hidden" />
                          <div className={cn("w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center", form.replaceMode === m.value ? "border-current" : "border-white/20")}>
                            {form.replaceMode === m.value && <div className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />}
                          </div>
                          <span>{m.label}</span>
                        </label>
                      ))}
                    </div>
                  </FieldGroup>
                </div>

                <div className="col-span-2 flex items-center gap-2 pt-1">
                  <button type="button" onClick={() => setForm(f => ({ ...f, notify: !f.notify }))} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all", form.notify ? "border-white/20 text-white" : "border-white/5 text-white/30")} style={form.notify ? { background: `${ACCENT}10`, borderColor: `${ACCENT}30`, color: ACCENT } : {}}>
                    <Bell className="w-3.5 h-3.5" />
                    إشعار المستخدمين
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isFeatured: !f.isFeatured }))} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all", form.isFeatured ? "text-white" : "border-white/5 text-white/30")} style={form.isFeatured ? { background: `${ACCENT}10`, borderColor: `${ACCENT}30`, color: ACCENT } : { border: undefined }}>
                    <Star className="w-3.5 h-3.5" />
                    مميز
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {step === "form" && (
          <div className="border-t border-white/5 p-4 flex items-center justify-between shrink-0">
            <button type="button" onClick={() => setStep("source")} className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> تغيير الملف
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white text-sm transition-colors">إلغاء</button>
              <button form="app-form" type="submit" disabled={createMutation.isPending} className="px-5 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-50 flex items-center gap-1.5" style={{ background: ACCENT }}>
                {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                إضافة التطبيق
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminApps() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useAdminListApps({ page: 1, limit: 100 });
  const apps = data?.apps || [];
  const { data: catData } = useAdminListCategories();
  const categories = catData?.categories || [];

  const updateMutation = useAdminUpdateApp();
  const deleteMutation = useAdminDeleteApp();

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const filteredApps = useMemo(() => {
    if (!search.trim()) return apps;
    const q = search.toLowerCase();
    return apps.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.description || "").toLowerCase().includes(q) ||
      (a.categoryName || "").toLowerCase().includes(q)
    );
  }, [apps, search]);

  const allFilteredSelected = filteredApps.length > 0 && filteredApps.every(a => selectedIds.has(a.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredApps.map(a => a.id)));
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا التطبيق؟")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getAdminListAppsQueryKey() });
      toast({ title: "تم الحذف بنجاح" });
    } catch { toast({ title: "حدث خطأ", variant: "destructive" }); }
    setMenuOpenId(null);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.size} تطبيق؟`)) return;
    for (const id of selectedIds) { try { await deleteMutation.mutateAsync({ id }); } catch {} }
    queryClient.invalidateQueries({ queryKey: getAdminListAppsQueryKey() });
    setSelectedIds(new Set());
    toast({ title: `تم حذف ${selectedIds.size} تطبيق` });
  };

  const statusBadge = (app: App) => {
    const a = app as any;
    if (a.isHidden) return <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-yellow-500/10 text-yellow-400">مخفي</span>;
    if (a.isTestMode) return <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-400">تجريبي</span>;
    return <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-green-500/10 text-green-400">نشط</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-4" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">قائمة التطبيقات</h2>
            <p className="text-xs text-white/30 mt-0.5">{filteredApps.length} تطبيق</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate("/admin/apps/add-file")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> رفع ملف
            </button>
            <button
              onClick={() => navigate("/admin/apps/add-url")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" /> عبر رابط
            </button>
            <button
              onClick={() => navigate("/admin/apps/add-url")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-black"
              style={{ background: ACCENT }}
            >
              <Plus className="w-3.5 h-3.5" /> إضافة
            </button>
          </div>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input
            type="text"
            placeholder="ابحث عن تطبيق..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2 pr-3 pl-9 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20"
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-2.5" style={{ background: `${ACCENT}08` }}>
            <span className="text-sm font-medium" style={{ color: ACCENT }}>{selectedIds.size} محدد</span>
            <div className="flex-1" />
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20">
              <Trash2 className="w-3 h-3" /> حذف
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20">
              <EyeOff className="w-3 h-3" /> إخفاء
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500/20">
              <FlaskConical className="w-3 h-3" /> تجريبي
            </button>
          </div>
        )}

        <div className="bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right min-w-[600px]">
              <thead className="border-b border-white/5">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-white/25 hover:text-white">
                      {allFilteredSelected ? <CheckSquare className="w-4 h-4" style={{ color: ACCENT }} /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-white/30">الاسم</th>
                  <th className="px-4 py-3 text-xs font-medium text-white/30">الإصدار</th>
                  <th className="px-4 py-3 text-xs font-medium text-white/30 hidden sm:table-cell">Bundle ID</th>
                  <th className="px-4 py-3 text-xs font-medium text-white/30 hidden md:table-cell">الحجم</th>
                  <th className="px-4 py-3 text-xs font-medium text-white/30">الحالة</th>
                  <th className="px-4 py-3 text-xs font-medium text-white/30 hidden lg:table-cell">الفئة</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="p-12 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: ACCENT }} />
                  </td></tr>
                ) : filteredApps.length === 0 ? (
                  <tr><td colSpan={8} className="p-12 text-center text-white/25 text-sm">لا توجد تطبيقات</td></tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr key={app.id} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(app.id)} className="text-white/25 hover:text-white">
                          {selectedIds.has(app.id) ? <CheckSquare className="w-4 h-4" style={{ color: ACCENT }} /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={app.icon} alt={app.name} className="w-8 h-8 rounded-lg object-cover bg-white/5 shrink-0" onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${app.name}&background=111111&color=9fbcff&bold=true`; }} />
                          <span className="text-white font-medium text-sm truncate max-w-[140px]">{app.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">{app.version || "—"}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-white/30 text-xs font-mono">{(app as any).bundleId || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-white/30 text-xs hidden md:table-cell">{app.size || "—"}</td>
                      <td className="px-4 py-3">{statusBadge(app)}</td>
                      <td className="px-4 py-3 text-white/30 text-xs hidden lg:table-cell">{app.categoryName}</td>
                      <td className="px-4 py-3 relative">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === app.id ? null : app.id)}
                          className="p-1 rounded text-white/20 hover:text-white hover:bg-white/5"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpenId === app.id && (
                          <div className="absolute left-0 top-full mt-1 w-48 bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-50 py-1 text-right overflow-hidden">
                            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/app/${app.id}`); toast({ title: "تم نسخ الرابط" }); setMenuOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5">
                              <Copy className="w-3.5 h-3.5" /> نسخ الرابط
                            </button>
                            <button onClick={() => setMenuOpenId(null)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5">
                              <Edit2 className="w-3.5 h-3.5" /> تعديل
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-400 hover:bg-white/5">
                              <EyeOff className="w-3.5 h-3.5" /> وضع الإخفاء
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:bg-white/5">
                              <FlaskConical className="w-3.5 h-3.5" /> وضع التجربة
                            </button>
                            <div className="my-1 border-t border-white/5" />
                            <button onClick={() => handleDelete(app.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5">
                              <Trash2 className="w-3.5 h-3.5" /> حذف
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </AdminLayout>
  );
}
