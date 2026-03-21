import { useState } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminCreateApp, useAdminListCategories } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Globe, Loader2, AlertCircle, CheckCircle2, FileArchive,
  ArrowRight, Star, Bell, RefreshCw, ChevronLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ACCENT = "#9fbcff";
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
  { value: "by_bundle", label: "استبدال عبر Bundle ID (الأفضل)" },
  { value: "by_name", label: "استبدال عبر اسم التطبيق" },
  { value: "by_filename", label: "استبدال عبر اسم الملف" },
  { value: "new", label: "إضافة كإصدار جديد" },
];

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full bg-black border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:border-[#9fbcff]/50 focus:outline-none placeholder-white/20",
        className
      )}
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full bg-black border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:border-[#9fbcff]/50 focus:outline-none appearance-none"
    >
      {children}
    </select>
  );
}

export default function AdminAddByUrl() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: catData } = useAdminListCategories();
  const categories = catData?.categories || [];
  const createMutation = useAdminCreateApp();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<"url" | "parsing" | "form">("url");
  const [urlInput, setUrlInput] = useState("");
  const [parseError, setParseError] = useState("");
  const [parseProgress, setParseProgress] = useState("");
  const [parsed, setParsed] = useState<any>(null);

  const [form, setForm] = useState({
    name: "", bundleId: "", version: "", size: "", icon: "",
    description: "", downloadUrl: "",
    categoryId: 1, status: "active",
    replaceMode: "by_bundle",
    notify: false, isFeatured: false, isHot: false,
    minOsVersion: "",
  });

  const handleParse = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setStep("parsing");
    setParseError("");
    setParseProgress("جاري الاتصال بالسيرفر...");

    const timer = setTimeout(() => setParseProgress("جاري سحب معلومات الملف عبر Range Requests..."), 2000);
    const timer2 = setTimeout(() => setParseProgress("يتم استخراج Info.plist من الملف..."), 5000);
    const timer3 = setTimeout(() => setParseProgress("جاري قراءة بيانات التطبيق..."), 9000);

    try {
      const result = await callApi("/admin/ipa/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      clearTimeout(timer); clearTimeout(timer2); clearTimeout(timer3);
      setParsed(result);
      setForm(f => ({
        ...f,
        name: result.name || f.name,
        bundleId: result.bundleId || f.bundleId,
        version: result.version || f.version,
        size: result.size || f.size,
        icon: result.icon || f.icon,
        downloadUrl: url,
        minOsVersion: result.minOsVersion || f.minOsVersion,
      }));
      setStep("form");
    } catch (err: any) {
      clearTimeout(timer); clearTimeout(timer2); clearTimeout(timer3);
      setParseError(err.message || "فشل تحليل الرابط");
      setStep("url");
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
      await queryClient.invalidateQueries();
      toast({ title: "تمت إضافة التطبيق بنجاح" });
      navigate("/admin/apps");
    } catch {
      toast({ title: "حدث خطأ أثناء الإضافة", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto" dir="rtl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/admin/apps")} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            التطبيقات
          </button>
          <span className="text-white/20">/</span>
          <span className="text-white text-sm">إضافة عن طريق رابط</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}18` }}>
            <Globe className="w-5 h-5" style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">إضافة تطبيق عبر رابط مباشر</h1>
            <p className="text-sm text-white/40">سيتم سحب معلومات التطبيق تلقائياً من الرابط</p>
          </div>
        </div>

        {step === "url" && (
          <div className="space-y-4">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-5">
              <FieldGroup label="رابط ملف IPA المباشر">
                <Input
                  dir="ltr"
                  placeholder="https://example.com/app.ipa"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleParse()}
                />
              </FieldGroup>

              {parseError && (
                <div className="flex items-start gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              <div className="bg-white/3 rounded-xl p-4 space-y-2">
                <p className="text-xs font-medium text-white/60">كيف تعمل؟</p>
                <ul className="space-y-1.5 text-xs text-white/30">
                  <li className="flex items-start gap-2"><span style={{ color: ACCENT }}>١.</span> يسحب السيرفر معلومات الملف بدون تحميله بالكامل</li>
                  <li className="flex items-start gap-2"><span style={{ color: ACCENT }}>٢.</span> يستخرج الاسم والبندل والإصدار والأيقونة تلقائياً</li>
                  <li className="flex items-start gap-2"><span style={{ color: ACCENT }}>٣.</span> يمكنك مراجعة البيانات وحفظ التطبيق</li>
                </ul>
              </div>

              <button
                onClick={handleParse}
                disabled={!urlInput.trim()}
                className="w-full py-3 rounded-xl text-sm font-bold text-black disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                style={{ background: ACCENT }}
              >
                <Globe className="w-4 h-4" />
                تحليل الرابط واستخراج البيانات
              </button>
            </div>
          </div>
        )}

        {step === "parsing" && (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-16 flex flex-col items-center gap-5 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${ACCENT}15` }}>
                <Globe className="w-8 h-8" style={{ color: ACCENT }} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: ACCENT }} />
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-base">جاري تحليل الملف...</p>
              <p className="text-white/40 text-sm mt-1.5">{parseProgress}</p>
            </div>
            <div className="w-full max-w-xs bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full animate-pulse" style={{ background: ACCENT, width: "60%" }} />
            </div>
          </div>
        )}

        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {parsed && (
              <div className="bg-[#0a0a0a] border rounded-2xl p-4 flex items-center gap-4" style={{ borderColor: `${ACCENT}25` }}>
                {parsed.icon ? (
                  <img src={parsed.icon} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${ACCENT}10` }}>
                    <FileArchive className="w-7 h-7" style={{ color: ACCENT }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <p className="text-white font-bold truncate">{parsed.name || "تطبيق"}</p>
                  </div>
                  <p className="text-xs text-white/30 font-mono mt-0.5 truncate">{parsed.bundleId}</p>
                  <div className="flex gap-3 mt-1.5">
                    {parsed.version && <span className="text-xs font-medium" style={{ color: ACCENT }}>v{parsed.version}</span>}
                    {parsed.size && <span className="text-xs text-white/30">{parsed.size}</span>}
                    {parsed.minOsVersion && <span className="text-xs text-white/30">iOS {parsed.minOsVersion}+</span>}
                  </div>
                </div>
                <button type="button" onClick={() => setStep("url")} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors shrink-0">
                  <RefreshCw className="w-3.5 h-3.5" />
                  تغيير
                </button>
              </div>
            )}

            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-4">
              <p className="text-sm font-bold text-white/60 border-b border-white/5 pb-3">بيانات التطبيق</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FieldGroup label="اسم التطبيق *">
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
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    {categories.length === 0 && <option value={1}>تطبيقات</option>}
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
                    <div className="flex gap-2">
                      {form.icon && <img src={form.icon} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                      <Input dir="ltr" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="رابط الأيقونة أو مُستخرجة تلقائياً" className="flex-1" />
                    </div>
                  </FieldGroup>
                </div>
                <div className="col-span-2">
                  <FieldGroup label="الوصف">
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white h-20 focus:border-[#9fbcff]/50 focus:outline-none placeholder-white/20 resize-none"
                      placeholder="وصف اختياري للتطبيق..."
                    />
                  </FieldGroup>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-3">
              <p className="text-sm font-bold text-white/60 border-b border-white/5 pb-3">طريقة التحديث والاستبدال</p>
              <div className="space-y-2">
                {REPLACE_MODES.map(m => (
                  <label key={m.value} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all", form.replaceMode === m.value ? "border-current" : "border-white/5 hover:border-white/10")} style={form.replaceMode === m.value ? { background: `${ACCENT}10`, color: ACCENT, borderColor: `${ACCENT}30` } : { color: "rgba(255,255,255,0.4)" }}>
                    <input type="radio" name="replaceMode" value={m.value} checked={form.replaceMode === m.value} onChange={() => setForm({ ...form, replaceMode: m.value })} className="hidden" />
                    <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center", form.replaceMode === m.value ? "border-current" : "border-white/20")}>
                      {form.replaceMode === m.value && <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <span className="text-sm">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => setForm(f => ({ ...f, notify: !f.notify }))} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all", form.notify ? "border-current" : "border-white/10 text-white/30 hover:text-white/60")} style={form.notify ? { background: `${ACCENT}10`, borderColor: `${ACCENT}30`, color: ACCENT } : {}}>
                <Bell className="w-4 h-4" />
                إشعار المستخدمين
              </button>
              <button type="button" onClick={() => setForm(f => ({ ...f, isFeatured: !f.isFeatured }))} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all", form.isFeatured ? "border-current" : "border-white/10 text-white/30 hover:text-white/60")} style={form.isFeatured ? { background: `${ACCENT}10`, borderColor: `${ACCENT}30`, color: ACCENT } : {}}>
                <Star className="w-4 h-4" />
                تطبيق مميز
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 pb-8">
              <button type="button" onClick={() => navigate("/admin/apps")} className="px-6 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm transition-colors">
                إلغاء
              </button>
              <button type="submit" disabled={createMutation.isPending || !form.name} className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-40 transition-all" style={{ background: ACCENT }}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                إضافة التطبيق
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
