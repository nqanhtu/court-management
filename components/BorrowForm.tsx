import { User, Calendar, FileStack, Plus, Trash2, Printer } from "lucide-react";

export default function BorrowForm() {
  return (
    <div className="flex gap-8">
       {/* Left: Form Inputs */}
       <div className="flex-1 space-y-5">
         <div className="space-y-1.5">
           <label className="text-sm font-medium text-slate-700">Người mượn</label>
           <div className="relative">
             <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <select className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors appearance-none">
               <option>Chọn người dùng...</option>
               <option>Nguyễn Văn A - Phòng Hành Chính</option>
               <option>Lê Thị B - Phòng Kế Toán</option>
             </select>
           </div>
         </div>

         <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
               <label className="text-sm font-medium text-slate-700">Ngày mượn</label>
               <div className="relative">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input type="date" className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" defaultValue="2025-03-03" />
               </div>
            </div>
            <div className="space-y-1.5">
               <label className="text-sm font-medium text-slate-700">Hạn trả (Dự kiến)</label>
               <div className="relative">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input type="date" className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" defaultValue="2025-03-10" />
               </div>
            </div>
         </div>

         <div className="space-y-1.5">
           <label className="text-sm font-medium text-slate-700">Ghi chú phiếu mượn</label>
           <textarea className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors h-20 resize-none" placeholder="Lý do mượn, ghi chú tình trạng hồ sơ..."></textarea>
         </div>

         <div className="flex justify-end pt-4 border-t border-slate-100 gap-3 mt-auto">
             <button className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
               <Printer className="w-4 h-4" /> In phiếu
             </button>
             <button className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors">Lưu phiếu mượn</button>
         </div>
       </div>

       {/* Right: Selected Files List */}
       <div className="w-96 flex flex-col gap-4 border-l border-slate-100 pl-8">
          <div className="flex items-center justify-between">
             <h4 className="font-semibold text-slate-800">Danh sách hồ sơ</h4>
             <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">3</span>
          </div>

          <div className="flex gap-2">
             <div className="relative flex-1">
               <FileStack className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input type="text" placeholder="Nhập mã hoặc quét..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 outline-none transition-colors" />
             </div>
             <button className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
               <Plus className="w-4 h-4" />
             </button>
          </div>

          <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col">
             <div className="flex-1 overflow-auto p-2 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-start gap-3 group">
                     <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
                        <FileStack className="w-4 h-4" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">Hồ sơ vụ án tranh chấp đất đai {i}</p>
                        <p className="text-xs text-slate-500 font-mono">HS-2025-84{i}</p>
                     </div>
                     <button className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                ))}
             </div>
             <div className="p-3 border-t border-slate-200 bg-white text-xs text-slate-500 text-center">
                Đã chọn 3 hồ sơ
             </div>
          </div>
       </div>
    </div>
  );
}
