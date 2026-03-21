import { AdminLayout } from "@/components/layout/AdminLayout";
import { DollarSign, Calendar, Search, Square } from "lucide-react";

export default function AdminPurchases() {
  return (
    <AdminLayout>
      <div className="space-y-6" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111111] rounded-xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center"><DollarSign className="w-4 h-4 text-green-400" /></div>
              <span className="text-white/40 text-xs">إجمالي الأرباح</span>
            </div>
            <p className="text-2xl font-bold text-white">٠ د.ع</p>
          </div>
          <div className="bg-[#111111] rounded-xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><Calendar className="w-4 h-4 text-blue-400" /></div>
              <span className="text-white/40 text-xs">أرباح هذا الشهر</span>
            </div>
            <p className="text-2xl font-bold text-white">٠ د.ع</p>
          </div>
          <div className="bg-[#111111] rounded-xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center"><DollarSign className="w-4 h-4 text-purple-400" /></div>
              <span className="text-white/40 text-xs">عدد المدفوعات</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input placeholder="ابحث بالاسم، الكود، المبلغ..." className="w-full bg-[#111111] border border-white/10 rounded-lg py-2 pr-4 pl-10 text-sm text-white placeholder-[#8888aa] focus:outline-none focus:border-white/30" />
        </div>

        <div className="bg-[#111111] rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm text-right">
            <thead className="bg-[#0a0a0a] border-b border-white/10">
              <tr>
                <th className="px-4 py-3 w-10"><Square className="w-4 h-4 text-white/40" /></th>
                <th className="px-4 py-3 font-medium text-white/40">المشترك</th>
                <th className="px-4 py-3 font-medium text-white/40">كود الاشتراك</th>
                <th className="px-4 py-3 font-medium text-white/40">الباقة</th>
                <th className="px-4 py-3 font-medium text-white/40">المجموعة</th>
                <th className="px-4 py-3 font-medium text-white/40">المبلغ</th>
                <th className="px-4 py-3 font-medium text-white/40">التاريخ</th>
                <th className="px-4 py-3 font-medium text-white/40">الحالة</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={8} className="p-8 text-center text-white/40">لا يوجد عمليات شراء</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
