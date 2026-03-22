import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2, Smartphone, Send, AlertCircle, ArrowLeft } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";
const A = "#9fbcff";

interface CheckResult {
  found: boolean;
  subscriber?: {
    id: number;
    code: string;
    subscriberName: string | null;
    isActive: string;
    expiresAt: string | null;
  };
}

type Step = "checking" | "already-subscribed" | "form" | "submitting" | "success" | "error";

export default function Enroll() {
  const [, navigate] = useLocation();
  const udid = new URLSearchParams(window.location.search).get("udid") || "";

  const [step, setStep] = useState<Step>(udid ? "checking" : "form");
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deviceType, setDeviceType] = useState("iPhone");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!udid) return;
    fetch(`${API}/api/enroll/check?udid=${encodeURIComponent(udid)}`)
      .then((r) => r.json())
      .then((data: CheckResult) => {
        setCheckResult(data);
        if (data.found) {
          setStep("already-subscribed");
        } else {
          setStep("form");
        }
      })
      .catch(() => {
        setStep("form");
      });
  }, [udid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!udid) { setError("لم يتم الحصول على UDID — يرجى إعادة المحاولة"); return; }
    if (!name.trim()) { setError("الاسم مطلوب"); return; }
    if (!phone.trim()) { setError("رقم الهاتف مطلوب"); return; }
    setError("");
    setStep("submitting");

    try {
      const res = await fetch(`${API}/api/enroll/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), udid, deviceType, notes: notes.trim() }),
      });
      if (!res.ok) throw new Error("Server error");
      setStep("success");
    } catch {
      setStep("error");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${A}20`, border: `1px solid ${A}30` }}>
            <Smartphone className="w-8 h-8" style={{ color: A }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
            مسماري+
          </h1>
          <p className="text-white/40 text-sm">تسجيل طلب الاشتراك</p>
        </div>

        {step === "checking" && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-white/40" />
            <p className="text-white/40 text-sm">جارٍ التحقق من جهازك...</p>
          </div>
        )}

        {step === "already-subscribed" && checkResult?.subscriber && (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "#34C75920", border: "1px solid #34C75940" }}>
              <CheckCircle2 className="w-7 h-7 text-green-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg mb-1">جهازك مشترك بالفعل!</h2>
              {checkResult.subscriber.subscriberName && (
                <p className="text-white/60 text-sm">مرحباً، {checkResult.subscriber.subscriberName}</p>
              )}
            </div>
            <div className="bg-black/40 rounded-xl p-3 text-right space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">الكود</span>
                <span className="font-mono text-xs" style={{ color: A }}>{checkResult.subscriber.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">الحالة</span>
                <span className={checkResult.subscriber.isActive === "true" ? "text-green-400" : "text-red-400"}>
                  {checkResult.subscriber.isActive === "true" ? "نشط" : "غير نشط"}
                </span>
              </div>
              {checkResult.subscriber.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-white/40">ينتهي في</span>
                  <span className="text-white/70">{new Date(checkResult.subscriber.expiresAt).toLocaleDateString("ar-SA")}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(`/subscriber/${checkResult.subscriber!.id}`)}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: `${A}20`, color: A, border: `1px solid ${A}30` }}
            >
              عرض ملف الاشتراك
            </button>
          </div>
        )}

        {(step === "form" || step === "submitting") && (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-white font-bold text-base">طلب اشتراك جديد</h2>
              <p className="text-white/40 text-xs mt-0.5">أكمل بياناتك وسيتواصل معك فريقنا</p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {udid && (
                <div className="bg-black/30 rounded-xl p-3">
                  <p className="text-white/30 text-xs mb-1">معرّف الجهاز (UDID)</p>
                  <p className="font-mono text-xs text-white/50 break-all">{udid}</p>
                </div>
              )}

              {!udid && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-yellow-400/80 text-xs">
                    لم يتم اكتشاف UDID تلقائياً. افتح الرابط من التطبيق أو اتصل بالدعم.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">الاسم الكامل *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 text-right"
                  style={{ fontFamily: "IBM Plex Sans Arabic, sans-serif" }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">رقم الهاتف *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 text-left font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">نوع الجهاز</label>
                <div className="flex gap-2">
                  {["iPhone", "iPad", "Mac"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDeviceType(type)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border"
                      style={deviceType === type
                        ? { background: `${A}20`, color: A, borderColor: `${A}40` }
                        : { background: "transparent", color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.08)" }
                      }
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">ملاحظات (اختياري)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي معلومات إضافية..."
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 text-right resize-none"
                  style={{ fontFamily: "IBM Plex Sans Arabic, sans-serif" }}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={step === "submitting"}
                className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: A, color: "#000" }}
              >
                {step === "submitting" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {step === "submitting" ? "جارٍ الإرسال..." : "إرسال الطلب"}
              </button>
            </form>
          </div>
        )}

        {step === "success" && (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "#34C75920", border: "1px solid #34C75940" }}>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl mb-2">تم إرسال طلبك!</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                سيتواصل معك فريقنا في أقرب وقت ممكن لتفعيل اشتراكك.
              </p>
            </div>
            <div className="bg-black/30 rounded-xl p-3 text-right text-sm space-y-1">
              <p className="text-white/30 text-xs">معرّف جهازك المسجل</p>
              <p className="font-mono text-xs text-white/40 break-all">{udid}</p>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="bg-[#0a0a0a] border border-red-500/20 rounded-2xl p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <div>
              <h2 className="text-white font-bold text-xl mb-2">حدث خطأ</h2>
              <p className="text-white/50 text-sm">تعذّر إرسال طلبك، يرجى المحاولة مرة أخرى.</p>
            </div>
            <button
              onClick={() => setStep("form")}
              className="flex items-center gap-2 mx-auto text-sm text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              إعادة المحاولة
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
