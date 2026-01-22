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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
            <Button 
              onClick={handleAnalyze}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-all h-auto"
            >
              {isAnalyzing ? "Đang phân tích..." : <><UploadCloud className="w-4 h-4" /> Tải tài liệu lên</>}
            </Button>
            <Button variant="outline" className="bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 text-sm font-medium py-2 px-4 rounded-lg transition-colors h-auto">
              Quét từ máy Scan
            </Button>
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
                    <Input type="text" disabled value="HS-2025-0842" className="w-full px-3 py-2 bg-slate-50 border-slate-200 rounded-lg text-sm font-mono text-slate-600 select-all" />
                  </div>
                   <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase">Mã tham chiếu (Ref)</label>
                    <Input type="text" placeholder="VD: HS-GOC-01" className="w-full px-3 py-2 bg-white border-slate-200 rounded-lg text-sm focus-visible:ring-indigo-500 outline-none transition-colors" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase">Tiêu đề hồ sơ <span className="text-red-500">*</span></label>
                  <Textarea className="w-full px-3 py-2 bg-white border-slate-200 rounded-lg text-sm focus-visible:ring-indigo-500 outline-none transition-colors h-24 resize-none font-medium" placeholder="Nhập tiêu đề hồ sơ đầy đủ..." />
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
                    <Select>
                      <SelectTrigger className="w-full bg-white border-slate-200 h-10">
                        <SelectValue placeholder="Chọn loại án" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HS">Hình sự</SelectItem>
                        <SelectItem value="DS">Dân sự</SelectItem>
                        <SelectItem value="HC">Hành chính</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase">Thời hạn bảo quản</label>
                    <Select>
                      <SelectTrigger className="w-full bg-white border-slate-200 h-10">
                        <SelectValue placeholder="Chọn thời hạn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VV">Vĩnh viễn</SelectItem>
                        <SelectItem value="70">70 năm</SelectItem>
                        <SelectItem value="20">20 năm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase">Thời gian bắt đầu</label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
                      <Input type="date" className="w-full pl-8 pr-3 py-2 bg-white border-slate-200 rounded-lg text-sm focus-visible:ring-indigo-500 outline-none transition-colors" />
                    </div>
                  </div>
                   <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase">Thời gian kết thúc</label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
                      <Input type="date" className="w-full pl-8 pr-3 py-2 bg-white border-slate-200 rounded-lg text-sm focus-visible:ring-indigo-500 outline-none transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="space-y-1">
                     <label className="text-xs font-medium text-slate-500 uppercase">Số tờ</label>
                     <Input type="number" className="w-full px-3 py-2 bg-white border-slate-200 rounded-lg text-sm text-center" placeholder="0" />
                   </div>
                    <div className="space-y-1 col-span-2">
                     <label className="text-xs font-medium text-slate-500 uppercase">Mục lục văn bản (MLVB)</label>
                     <Input type="text" className="w-full px-3 py-2 bg-white border-slate-200 rounded-lg text-sm" placeholder="Nhập mã..." />
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
                   <Select>
                      <SelectTrigger className="w-full bg-white border-slate-200 h-10">
                        <SelectValue placeholder="Chọn kho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KHO_A">Kho A - Tầng 1</SelectItem>
                        <SelectItem value="KHO_B">Kho B - Tầng 2</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-medium text-slate-500 uppercase">Kệ (Shelf)</label>
                   <Select>
                      <SelectTrigger className="w-full bg-white border-slate-200 h-10">
                        <SelectValue placeholder="Chọn kệ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A01">Kệ A-01</SelectItem>
                        <SelectItem value="A02">Kệ A-02</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-medium text-slate-500 uppercase">Hộp/Cặp (Box)</label>
                   <Select>
                      <SelectTrigger className="w-full bg-white border-slate-200 h-10">
                        <SelectValue placeholder="Chọn hộp" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="BOX05">Hộp số 05</SelectItem>
                         <SelectItem value="BOX06">Hộp số 06</SelectItem>
                      </SelectContent>
                   </Select>
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
         <Button variant="outline" className="px-6 py-2 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors h-auto">
            Hủy bỏ
         </Button>
         <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg shadow-lg shadow-indigo-200 transition-all h-auto">
            <Save className="w-4 h-4" />
            Lưu hồ sơ
          </Button>
      </div>
    </div>
  );
}
