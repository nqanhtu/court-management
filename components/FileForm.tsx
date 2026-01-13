"use client";

import { 
  Save, 
  Calendar, 
  Tag, 
  Hash, 
  ScanLine, 
  UploadCloud, 
  Wand2, 
  AlertCircle, 
  MapPin,
  CheckCircle2,
  Grid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function FileForm() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
       {/* Smart Input Zone */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <ScanLine className="w-32 h-32 text-indigo-600" />
        </div>
        
        <div className="relative z-10 max-w-lg">
          <h3 className="text-indigo-900 font-bold text-lg mb-1 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-600" /> Trích xuất thông tin tự động
          </h3>
          <p className="text-indigo-700/80 text-sm mb-4">
            Tải lên bản scan hoặc hình ảnh bìa hồ sơ. AI sẽ tự động điền các trường dữ liệu.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={handleAnalyze}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
            >
              {isAnalyzing ? "Đang phân tích..." : <><UploadCloud className="w-4 h-4" /> Tải tài liệu lên</>}
            </button>
            <button className="bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 text-sm font-medium py-2 px-4 rounded-lg transition-colors">
              Quét từ máy Scan
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Form Fields */}
        <div className="flex-1 flex flex-col gap-6">
            {/* Group 1: Định danh */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="p-1.5 bg-slate-100 rounded text-slate-600"><Hash className="w-4 h-4" /></div>
                <h3 className="font-semibold text-slate-800">Định danh hồ sơ</h3>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase">Mã hồ sơ (System)</label>
                    <input type="text" disabled value="HS-2025-0842" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-600 select-all" />
                  </div>
                   <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase">Mã tham chiếu (Ref)</label>
                    <input type="text" placeholder="VD: HS-GOC-01" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase">Tiêu đề hồ sơ <span className="text-red-500">*</span></label>
                  <textarea className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors h-24 resize-none font-medium" placeholder="Nhập tiêu đề hồ sơ đầy đủ..."></textarea>
                </div>
              </div>
            </div>

            {/* Group 2: Phân loại */}
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="p-1.5 bg-slate-100 rounded text-slate-600"><Tag className="w-4 h-4" /></div>
                <h3 className="font-semibold text-slate-800">Phân loại & Thời hạn</h3>
              </div>
              
              <div className="space-y-3">
                 <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase">Loại án/Hồ sơ</label>
                    <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors">
                      <option>Hình sự</option>
                      <option>Dân sự</option>
                      <option>Hành chính</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase">Thời hạn bảo quản</label>
                    <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors">
                      <option>Vĩnh viễn</option>
                      <option>70 năm</option>
                      <option>20 năm</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase">Thời gian bắt đầu</label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input type="date" className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                  </div>
                   <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase">Thời gian kết thúc</label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input type="date" className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="space-y-1">
                     <label className="text-xs font-medium text-slate-500 uppercase">Số tờ</label>
                     <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-center" placeholder="0" />
                   </div>
                    <div className="space-y-1 col-span-2">
                     <label className="text-xs font-medium text-slate-500 uppercase">Mục lục văn bản (MLVB)</label>
                     <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" placeholder="Nhập mã..." />
                   </div>
                </div>
              </div>
            </div>

            {/* Group 3: Vị trí lưu kho */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="p-1.5 bg-slate-100 rounded text-slate-600"><MapPin className="w-4 h-4" /></div>
                <h3 className="font-semibold text-slate-800">Vị trí lưu kho vật lý</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                   <label className="text-xs font-medium text-slate-500 uppercase">Kho (Room)</label>
                   <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                      <option>Kho A - Tầng 1</option>
                      <option>Kho B - Tầng 2</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-medium text-slate-500 uppercase">Kệ (Shelf)</label>
                   <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                      <option>Kệ A-01</option>
                      <option>Kệ A-02</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-medium text-slate-500 uppercase">Hộp/Cặp (Box)</label>
                   <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                      <option>Hộp số 05</option>
                      <option>Hộp số 06</option>
                   </select>
                </div>
              </div>
              
               {/* Visual Shelf Representation */}
               <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                 <div className="flex gap-1 h-8">
                   {[...Array(10)].map((_, i) => (
                     <div key={i} className={cn(
                       "flex-1 rounded-sm border-t-2 transition-all hover:opacity-80",
                       i < 7 ? "bg-slate-300 border-slate-400" : "bg-white border-dashed border-slate-300",
                       i === 7 && "bg-indigo-100 border-indigo-500 ring-1 ring-indigo-200"
                     )} title={i < 7 ? "Đã có hồ sơ" : "Trống"}></div>
                   ))}
                 </div>
               </div>
            </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-80 flex flex-col gap-6 shrink-0">
          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h4 className="font-semibold text-slate-800 text-sm mb-3">Trạng thái hồ sơ</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                 <span className="text-slate-500">Mức độ hoàn thiện</span>
                 <span className="font-bold text-indigo-600">85%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[85%] rounded-full"></div>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Định danh hợp lệ
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                  <AlertCircle className="w-3.5 h-3.5" /> Chưa có file số hóa
                </div>
              </div>
            </div>
          </div>

          {/* Barcode Preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm">Mã vạch</h3>
                <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Preview</span>
             </div>
             <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
               <Grid className="w-8 h-8" />
             </div>
          </div>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="flex justify-end pt-4 border-t border-slate-200 gap-3">
         <button className="px-6 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors">
            Hủy bỏ
         </button>
         <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-lg shadow-indigo-200 transition-all">
            <Save className="w-4 h-4" />
            Lưu hồ sơ
          </button>
      </div>
    </div>
  );
}
