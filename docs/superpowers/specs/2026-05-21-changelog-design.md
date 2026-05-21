# Spec: Chuyên trang Đọc Changelog Hệ thống (Public & Standalone)

Tài liệu này đặc tả thiết kế và kế hoạch triển khai chuyên trang đọc nhật ký thay đổi hệ thống (Changelog) từ các file `.md` trong thư mục `docs/`. Trang này hoạt động độc lập, không yêu cầu xác thực người dùng.

## 1. Yêu cầu & Mục tiêu

- **Không cần Auth**: Truy cập trực tiếp qua đường dẫn `/changelog`.
- **Tự động quét**: Tự động nhận diện, phân tích và liệt kê toàn bộ file `.md` trong thư mục `docs/` của dự án mà không cần đăng ký thủ công.
- **Bố cục Modern Developer Docs**: Giao diện 3 cột chuyên nghiệp (Sidebar danh sách file - Nội dung chính - Mục lục nhanh TOC).
- **Trải nghiệm đọc cao cấp**: Tương thích hoàn hảo với cả Light Mode và Dark Mode, sử dụng font hệ thống mượt mà, định dạng Markdown trực quan, hỗ trợ thiết bị di động (Responsive).
- **Hỗ trợ điều hướng**: Có nút quay lại để điều hướng nhanh về Dashboard hoặc trang Login tùy trạng thái phiên đăng nhập.

## 2. Thiết kế Kiến trúc & Dữ liệu

### 2.1. Server-side Scanning (Next.js Server Component)

Next.js Server Component sẽ thực hiện quét thư mục `docs/` trực tiếp bằng Node.js filesystem API ở runtime:
1. Đọc danh sách file bằng `fs.promises.readdir` từ `path.join(process.cwd(), 'docs')`.
2. Lọc các file có đuôi mở rộng `.md`.
3. Với mỗi file, đọc dòng đầu tiên chứa tiêu đề `# ...` để làm tên hiển thị hiển thị trên menu. Nếu không tìm thấy, sử dụng tên file được format lại làm fallback.
4. Trích xuất chuỗi ngày tháng từ tên file dạng `YYYY-MM-DD` (nếu có) để sắp xếp danh sách theo thứ tự thời gian giảm dần (mới nhất hiển thị đầu tiên).

### 2.2. Cơ chế Chọn File Động

- Sử dụng tham số URL `?file=filename.md` để xác định file cần hiển thị.
- Nếu không truyền tham số `file`, hệ thống mặc định hiển thị file mới nhất.
- Khi người dùng click chọn bản ghi khác ở Sidebar, Next.js sẽ chuyển trang mượt mà bằng Client-side Navigation tới `/changelog?file=filename.md`, kích hoạt Server Component đọc và render file mới.

### 2.3. Biên dịch Markdown (Markdown Compiler)

- Sử dụng thư viện `marked` để chuyển đổi tài liệu Markdown sang mã HTML an toàn.
- Do các tài liệu được viết bởi đội ngũ phát triển nội bộ trong thư mục code, việc render bằng `dangerouslySetInnerHTML` ở server-side là an toàn và tối ưu hiệu suất.

## 3. Các thay đổi đề xuất

### 3.1. Cài đặt thư viện phụ trợ

Cài đặt gói `marked` để hỗ trợ parse markdown:
```bash
pnpm add marked
```

### 3.2. Tạo route mới: [app/changelog/page.tsx](file:///f:/projects/court-management/app/changelog/page.tsx)

Trang này chịu trách nhiệm:
- Quét danh sách file trong `docs/`.
- Đọc nội dung file được chọn từ query parameter.
- Trích xuất mục lục TOC (Table of Contents) bằng cách tìm các tiêu đề `h2` trong nội dung markdown.
- Render bố cục giao diện 3 cột.

### 3.3. Cải tiến CSS: [app/globals.css](file:///f:/projects/court-management/app/globals.css)

Bổ sung các CSS utility class chuyên dụng cho lớp `.markdown-body` để định dạng các thẻ Markdown được biên dịch (Headings, Paragraphs, Lists, Code blocks, Tables) tương thích với cả light & dark mode của Next-themes.

## 4. Kế hoạch Kiểm thử & Xác minh

### 4.1. Kiểm thử Tự động (Build & Lint)
- Kiểm tra build tĩnh Next.js: `pnpm run build` phải thành công mà không có lỗi TypeScript hay Lint.

### 4.2. Kiểm thử Thủ công (Manual Verification)
- Truy cập `/changelog` khi chưa đăng nhập: Phải xem được bình thường, không bị redirect về `/login`.
- Đăng nhập hệ thống và truy cập `/changelog`: Nút quay lại phải đưa người dùng về trang chủ `/`.
- Thử thêm một file `.md` giả lập mới vào `docs/` (ví dụ `nang-cap-he-thong-2026-05-22.md`): Tải lại trang `/changelog`, file mới phải xuất hiện đầu tiên trong danh sách menu và có thể đọc nội dung thành công.
- Kiểm tra hiển thị giao diện trên thiết bị di động: Bố cục 3 cột phải co giãn hợp lý, ẩn cột mục lục TOC và chuyển danh sách menu file thành dạng dropdown hoặc panel mở rộng để tối ưu không gian đọc.
