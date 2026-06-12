"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal";
import { Printer } from "lucide-react";
import { FileWithBox } from "./columns";

export function PrintFileCoversDialog({
  files,
  isOpen,
  onClose,
}: {
  files: FileWithBox[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const [layout, setLayout] = useState<"1" | "2" | "4">("2");

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "";
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: vi });
    } catch {
      return "";
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=800");
    if (!printWindow) return;

    let gridStyle = "grid-template-columns: 1fr;";
    let pageBreak = "page-break-after: always;";
    if (layout === "2") {
      gridStyle = "grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; gap: 20mm;";
    } else if (layout === "4") {
      gridStyle = "grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 10mm;";
    }

    const numPerPage = layout === "1" ? 1 : layout === "2" ? 2 : 4;
    const chunks = [];
    for (let i = 0; i < files.length; i += numPerPage) {
      chunks.push(files.slice(i, i + numPerPage));
    }

    const htmlPages = chunks.map(chunkFiles => {
      const chunkHtml = chunkFiles
        .map((file) => {
          const typeYear = `${file.type || ""} ${file.year || ""}`.trim();
          const plaintiffs = (file.plaintiffs || []).join(", ");
          const defendants = (file.defendants || []).join(", ");
          const civilDefendants = ((file as any).civilDefendants || []).join(", ");

          return `
            <div class="cover-wrapper">
              <table class="cover-table">
                <tbody>
                  <tr>
                    <td class="label">Loại án:</td>
                    <td class="value font-bold">${typeYear}</td>
                  </tr>
                  <tr>
                    <td class="label">Mã hồ sơ:</td>
                    <td class="value">${file.code || ""}</td>
                  </tr>
                  <tr>
                    <td class="label">Số bản án/<br/>quyết định:</td>
                    <td class="value">${file.judgmentNumber || ""}</td>
                  </tr>
                  <tr>
                    <td class="label">Ngày:</td>
                    <td class="value">${formatDate(file.judgmentDate)}</td>
                  </tr>
                  <tr>
                    <td class="label">Nguyên Đơn:</td>
                    <td class="value">${plaintiffs}</td>
                  </tr>
                  <tr>
                    <td class="label">Bị cáo:</td>
                    <td class="value">${defendants}</td>
                  </tr>
                  <tr>
                    <td class="label">Số bút lục:</td>
                    <td class="value">${file.pageCount || ""}</td>
                  </tr>
                  <tr>
                    <td class="label">Vụ việc:</td>
                    <td class="value">${file.title || ""}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;
        })
        .join("");
        
        return `<div class="page-container">${chunkHtml}</div>`;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>In bìa hồ sơ</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              margin: 0;
              padding: 0;
              font-size: 14pt;
              line-height: 1.5;
            }
            .page-container {
              display: grid;
              ${gridStyle}
              height: calc(100vh - 30mm);
              page-break-after: always;
            }
            .cover-wrapper {
              display: flex;
              flex-direction: column;
              border: 2px solid #000;
              padding: 10px;
              box-sizing: border-box;
              page-break-inside: avoid;
            }
            .cover-table {
              width: 100%;
              border-collapse: collapse;
            }
            .cover-table td {
              border: 1px solid #000;
              padding: 8px 12px;
              vertical-align: top;
            }
            .cover-table td.label {
              width: 35%;
              font-weight: normal;
            }
            .cover-table td.value {
              width: 65%;
            }
            .font-bold {
              font-weight: bold;
            }
            
            /* Print Specific */
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px; font-family: sans-serif;">
             <p>Cửa sổ sẽ tự động đóng sau khi in.</p>
          </div>
          <div class="print-container">
            ${htmlPages}
          </div>
          <script>
            window.onload = () => {
                setTimeout(() => {
                    window.print();
                    window.close();
                }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="In bìa hồ sơ" className="max-w-md">
      <div className="space-y-6">
        <div className="text-sm text-muted-foreground">
          Bạn đã chọn <strong>{files.length}</strong> hồ sơ để in bìa.
          Vui lòng chọn cách ghép trên khổ giấy A4:
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Button
            variant={layout === "1" ? "default" : "outline"}
            className="h-auto flex-col py-4"
            onClick={() => setLayout("1")}
          >
            <span className="text-lg font-bold mb-1">1</span>
            <span className="text-xs">bìa / A4</span>
          </Button>
          <Button
            variant={layout === "2" ? "default" : "outline"}
            className="h-auto flex-col py-4"
            onClick={() => setLayout("2")}
          >
            <span className="text-lg font-bold mb-1">2</span>
            <span className="text-xs">bìa / A4</span>
          </Button>
          <Button
            variant={layout === "4" ? "default" : "outline"}
            className="h-auto flex-col py-4"
            onClick={() => setLayout("4")}
          >
            <span className="text-lg font-bold mb-1">4</span>
            <span className="text-xs">bìa / A4</span>
          </Button>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Bắt đầu in
          </Button>
        </div>
      </div>
    </Modal>
  );
}
