import { AdminLayout } from "@/components/layout/AdminLayout";
import { Search, CheckSquare, Square } from "lucide-react";
import { useState } from "react";

export default function AdminRequests() {
  const [search, setSearch] = useState("");
  return (
    <AdminLayout>
      <div className="space-y-4" dir="rtl">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/40">0 طلب</span>
          <div className="relative max-w-sm flex-1 mr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#111111] border border-white/10 rounded-lg py-2 pr-4 pl-10 text-sm text-white placeholder-[#8888aa] focus:outline-none focus:border-white/30" />
          </div>
        </div>
        <div className="bg-[#111111] rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm text-right">
            <thead className="bg-[#0a0a0a] border-b border-white/10">
              <tr>
                <th className="px-4 py-3 w-10"><Square className="w-4 h-4 text-white/40" /></th>
                <th className="px-4 py-3 font-medium text-white/40">الاسم</th>
                <th className="px-4 py-3 font-medium text-white/40">الهاتف</th>
                <th className="px-4 py-3 font-medium text-white/40">الباقة</th>
                <th className="px-4 py-3 font-medium text-white/40">الحالة</th>
                <th className="px-4 py-3 font-medium text-white/40">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={6} className="p-8 text-center text-white/40">لا يوجد طلبات</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
