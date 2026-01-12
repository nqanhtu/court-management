import { User, Building2, Phone, Mail, CreditCard, MapPin } from "lucide-react";

export default function UserForm() {
  return (
    <div className="flex gap-8">
      {/* Avatar / Identity Section */}
      <div className="w-64 flex flex-col gap-4 shrink-0">
         <div className="aspect-square rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden">
            <User className="w-16 h-16 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium mt-2">Tải ảnh đại diện</span>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
         </div>
         <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
           <h4 className="text-sm font-bold text-indigo-900 mb-1">Mẹo</h4>
           <p className="text-xs text-indigo-700 leading-relaxed">
             Bạn có thể dùng CCCD gắn chip để tự động điền thông tin cá nhân.
           </p>
           <button className="mt-2 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 py-1.5 px-3 rounded w-full hover:bg-indigo-50 transition-colors">
             Quét CCCD
           </button>
         </div>
      </div>

      {/* Main Fields */}
      <div className="flex-1 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Họ và tên <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="Nhập họ và tên..." />
            </div>
          </div>
           <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Đơn vị công tác</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="Phòng ban..." />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="09..." />
            </div>
          </div>
           <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="example@mail.com" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Số CCCD / CMND</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="0123..." />
            </div>
        </div>

        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Địa chỉ liên hệ</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors h-24 resize-none" placeholder="Nhập địa chỉ..."></textarea>
            </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
             <button className="px-5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">Hủy</button>
             <button className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors">Lưu thông tin</button>
        </div>
      </div>
    </div>
  );
}
