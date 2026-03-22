import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Plus, Trash2, Edit2, X, Loader2, Eye, EyeOff, Link2, Image as ImageIcon, Globe } from "lucide-react";
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

interface Banner {
  id: number;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  image: string | null;
  imageEn: string | null;
  link: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

const blankForm = {
  title: "", titleEn: "",
  description: "", descriptionEn: "",
  image: "", imageEn: "",
  link: "", isActive: true,
};

function LangField({ label, ar, en, onChangeAr, onChangeEn, placeholder, ltr = false }: {
  label: string; ar: string; en: string;
  onChangeAr: (v: string) => void; onChangeEn: (v: string) => void;
  placeholder?: string; ltr?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: `${A}99` }}>
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] text-white/30 mb-1 flex items-center gap-1">
            <Globe className="w-2.5 h-2.5" /> عربي
          </div>
          <input
            dir={ltr ? "ltr" : "rtl"}
            value={ar}
            onChange={e => onChangeAr(e.target.value)}
            placeholder={placeholder ? `${placeholder} (ع)` : "عربي"}
            className="w-full bg-black border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:border-[#9fbcff]/50 focus:outline-none placeholder-white/20"
          />
        </div>
        <div>
          <div className="text-[10px] text-white/30 mb-1 flex items-center gap-1">
            <Globe className="w-2.5 h-2.5" /> English
          </div>
          <input
            dir="ltr"
            value={en}
            onChange={e => onChangeEn(e.target.value)}
            placeholder={placeholder ? `${placeholder} (EN)` : "English"}
            className="w-full bg-black border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:border-[#9fbcff]/50 focus:outline-none placeholder-white/20"
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminFeatured() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    const d = await adminFetch("/admin/featured");
    setBanners(d?.banners || []);
    setLoading(false);
  };
  useEffect(() => { fetchBanners(); }, []);

  const openAdd = () => { setForm(blankForm); setEditBanner(null); setModal("add"); };
  const openEdit = (b: Banner) => {
    setForm({
      title: b.title, titleEn: b.titleEn || "",
      description: b.description || "", descriptionEn: b.descriptionEn || "",
      image: b.image || "", imageEn: b.imageEn || "",
      link: b.link || "", isActive: b.isActive,
    });
    setEditBanner(b);
    setModal("edit");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.title) { toast({ title: "العنوان بالعربي مطلوب", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const body = JSON.stringify({
        title: form.title,
        titleEn: form.titleEn || null,
        description: form.description || null,
        descriptionEn: form.descriptionEn || null,
        image: form.image || null,
        imageEn: form.imageEn || null,
        link: form.link || null,
        isActive: form.isActive,
      });
      if (editBanner) {
        await adminFetch(`/admin/featured/${editBanner.id}`, { method: "PUT", body });
        toast({ title: "تم تحديث البانر" });
      } else {
        await adminFetch("/admin/featured", { method: "POST", body });
        toast({ title: "تمت إضافة البانر" });
      }
      fetchBanners();
      setModal(null);
    } catch { toast({ title: "حدث خطأ", variant: "destructive" }); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا البانر؟")) return;
    await adminFetch(`/admin/featured/${id}`, { method: "DELETE" });
    toast({ title: "تم الحذف" });
    fetchBanners();
  };

  const toggleActive = async (b: Banner) => {
    await adminFetch(`/admin/featured/${b.id}`, { method: "PUT", body: JSON.stringify({ isActive: !b.isActive }) });
    fetchBanners();
  };

  const arImage = form.image;
  const enImage = form.imageEn;

  return (
    <AdminLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">البنرات</h2>
            <p className="text-white/40 text-xs mt-0.5">بنرات وإعلانات الصفحة الرئيسية — باللغتين العربية والإنجليزية</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black" style={{ background: A }}>
            <Plus className="w-4 h-4" /> إضافة بانر
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
        ) : (
          <div className="space-y-3">
            {banners.map(b => (
              <div key={b.id} className="bg-[#111111] rounded-xl border border-white/8 overflow-hidden group">
                <div className="flex items-stretch">
                  <div className="w-24 sm:w-32 shrink-0 bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
                    {b.image ? (
                      <img src={b.image} alt={b.title} className="w-full h-full object-cover absolute inset-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-white/20" />
                    )}
                  </div>
                  <div className="flex-1 px-4 py-3 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-white font-semibold text-sm truncate">{b.title}</h3>
                          {b.titleEn && <span className="text-white/40 text-xs truncate">{b.titleEn}</span>}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${b.isActive ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>
                            {b.isActive ? "نشط" : "مخفي"}
                          </span>
                        </div>
                        {(b.description || b.descriptionEn) && (
                          <p className="text-white/40 text-xs truncate">
                            {b.description}{b.description && b.descriptionEn ? " / " : ""}{b.descriptionEn}
                          </p>
                        )}
                        {b.link && (
                          <div className="flex items-center gap-1 mt-1">
                            <Link2 className="w-3 h-3 shrink-0" style={{ color: `${A}80` }} />
                            <span className="text-xs font-mono truncate" style={{ color: `${A}80` }}>{b.link}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/25">
                          {b.image && <span>🖼 ع</span>}
                          {b.imageEn && <span>🖼 EN</span>}
                          <span>ترتيب: {b.sortOrder}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleActive(b)} className={`p-1.5 rounded-lg transition-colors ${b.isActive ? "text-white/40 hover:text-yellow-400 hover:bg-yellow-500/10" : "text-white/40 hover:text-green-400 hover:bg-green-500/10"}`}>
                          {b.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {banners.length === 0 && (
              <div className="py-16 text-center text-white/30 text-sm bg-[#111111] rounded-xl border border-white/5">
                لا توجد بنرات بعد — اضغط "إضافة بانر" لإنشاء أول بانر
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm" dir="rtl">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
              <h3 className="text-base font-bold text-white">{editBanner ? "تعديل بانر" : "إضافة بانر"}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <LangField
                label="العنوان *"
                ar={form.title} en={form.titleEn}
                onChangeAr={v => setForm(f => ({ ...f, title: v }))}
                onChangeEn={v => setForm(f => ({ ...f, titleEn: v }))}
                placeholder="عنوان البانر"
              />

              <LangField
                label="الوصف"
                ar={form.description} en={form.descriptionEn}
                onChangeAr={v => setForm(f => ({ ...f, description: v }))}
                onChangeEn={v => setForm(f => ({ ...f, descriptionEn: v }))}
                placeholder="وصف مختصر"
              />

              <LangField
                label="رابط الصورة"
                ar={form.image} en={form.imageEn}
                onChangeAr={v => setForm(f => ({ ...f, image: v }))}
                onChangeEn={v => setForm(f => ({ ...f, imageEn: v }))}
                placeholder="https://..."
                ltr
              />

              {(arImage || enImage) && (
                <div className="grid grid-cols-2 gap-2">
                  {arImage && (
                    <div>
                      <div className="text-[10px] text-white/30 mb-1">معاينة الصورة العربية</div>
                      <div className="rounded-lg overflow-hidden border border-white/10 h-20 bg-black">
                        <img src={arImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  {enImage && (
                    <div>
                      <div className="text-[10px] text-white/30 mb-1">English Image Preview</div>
                      <div className="rounded-lg overflow-hidden border border-white/10 h-20 bg-black">
                        <img src={enImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: `${A}99` }}>
                  الرابط عند الضغط
                </label>
                <input
                  dir="ltr"
                  value={form.link}
                  onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-black border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:border-[#9fbcff]/50 focus:outline-none placeholder-white/20"
                />
                <p className="text-[10px] text-white/25">رابط واحد ثابت للنسختين العربية والإنجليزية</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all"
                  style={form.isActive ? { background: `${A}15`, borderColor: `${A}40`, color: A } : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                  {form.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {form.isActive ? "نشط" : "مخفي"}
                </button>
              </div>
            </div>

            <div className="border-t border-white/5 p-4 flex justify-end gap-2 shrink-0">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white text-sm">إلغاء</button>
              <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-50 flex items-center gap-1.5" style={{ background: A }}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {editBanner ? "حفظ" : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
