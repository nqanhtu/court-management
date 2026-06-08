# Thiết kế hệ thống: Nhập liệu nhanh & Gợi ý tự động (Quick Data Input & Autocomplete)

Tài liệu này đặc tả thiết kế kỹ thuật cho tính năng hỗ trợ nhập liệu nhanh khi tạo và chỉnh sửa hồ sơ vụ án/văn bản con, bao gồm việc tự động gợi ý giá trị (Loại án, Thời hạn bảo quản, Tiêu đề) và giữ lại dữ liệu của hồ sơ vừa tạo (Sticky Fields).

## 1. Yêu cầu & Luồng nghiệp vụ
* **Loại án (Case Type)** & **Bảo quản (Retention Period)**: 
  * Tự động hiển thị gợi ý khi click hoặc gõ ký tự tìm kiếm.
  * Hỗ trợ chọn nhanh bằng phím mũi tên và Enter/Tab mà không cần chạm vào chuột.
  * Danh sách gợi ý bao gồm các giá trị chuẩn (Predefined) và các giá trị thực tế đã được nhập trong cơ sở dữ liệu (Dynamic).
* **Tiêu đề / Trích yếu (Title / Summary)**:
  * Tự động gợi ý các cụm từ/tiền tố phổ biến khi gõ (VD: "Về việc...", "Tranh chấp...", "Vụ án...").
  * Tự động gợi ý tìm kiếm theo các tiêu đề gần đây nhất.
* **Giữ lại dữ liệu cũ (Sticky Fields)**:
  * Có nút toggle "Nhập liên tục (Giữ lại Loại án, Năm, Thời hạn bảo quản & Hộp số của hồ sơ trước)".
  * Khi bật tính năng này, sau khi Lưu hồ sơ thành công, form nhập mới tiếp theo sẽ được tự điền sẵn các giá trị từ hồ sơ vừa lưu.

---

## 2. Thiết kế Cơ sở dữ liệu & API Backend

### API Gợi ý tự động (`GET /api/files/autocomplete-suggestions`)
Tạo một endpoint mới để trả về danh sách các giá trị độc bản (distinct) trong database làm nguồn gợi ý cho frontend.

* **Quyền truy cập:** `viewFiles` (mọi tài khoản có quyền xem hồ sơ đều được dùng).
* **Logic xử lý backend (Prisma):**
  1. Lấy danh sách độc bản của `type` (Loại án) từ bảng `File`.
  2. Lấy danh sách độc bản của `retention` (Thời hạn bảo quản) từ bảng `File`.
  3. Lấy danh sách độc bản của `preservationTime` (Thời hạn bảo quản văn bản con) từ bảng `Document`.
  4. Lấy danh sách 100 tiêu đề hồ sơ gần đây nhất từ bảng `File` (để gợi ý tiền tố).
  
* **Payload phản hồi (JSON):**
  ```json
  {
    "types": ["Hình sự", "Dân sự", "Hành chính", "Kinh doanh thương mại", "Lao động", "Hôn nhân gia đình"],
    "retentions": ["10 năm", "15 năm", "20 năm", "70 năm", "Vĩnh viễn"],
    "titles": [
      "Vụ án trộm cắp tài sản",
      "Tranh chấp hợp đồng vay tài sản",
      "Ly hôn và tranh chấp nuôi con"
    ]
  }
  ```

---

## 3. Thiết kế Frontend & Giao diện Người dùng

### A. Thành phần `AutocompleteInput` (Component dùng chung)
Tạo component gợi ý nhập liệu sử dụng Radix Popover và CMDK để đảm bảo tối ưu hóa bàn phím (Keyboard accessibility).

* **Cách hoạt động:**
  * Kế thừa đầy đủ các thuộc tính của thẻ `input` thông thường.
  * Khi input nhận focus, hiển thị popover chứa danh sách gợi ý.
  * Hỗ trợ lọc danh sách theo chuỗi ký tự đang gõ.
  * Dùng phím `Mũi tên lên/xuống` để di chuyển, `Enter` hoặc `Tab` để chọn gợi ý và tự động chuyển sang trường tiếp theo.

### B. Tích hợp Form nhập liệu (`ManualFileForm`, `EditFileDialog`, `ChildDocumentFormModal`)
* **Chuyển đổi các trường Input sang `AutocompleteInput`**:
  * Trường **Loại án**: gợi ý danh sách loại án chuẩn + động.
  * Trường **Thời hạn bảo quản**: gợi ý thời hạn bảo quản chuẩn + động.
  * Trường **Tiêu đề / Trích yếu**: gợi ý tiền tố phổ biến hoặc tiêu đề gần đây.

* **Cơ chế Sticky Fields trong `ManualFileForm`**:
  * Thêm trạng thái `stickyEnabled` (lưu vào `localStorage` để giữ nguyên trạng thái khi tải lại trang).
  * Khi `stickyEnabled` là `true` và lưu thành công:
    * Giữ lại các giá trị: `type`, `year`, `retention`, `boxId`.
    * Xóa/Reset các trường: `code`, `title`, `judgmentNumber`, `judgmentDate`, `pageCount`, `defendants`, `plaintiffs`, `civilDefendants`, `note`.
    * Tự động đưa con trỏ focus vào trường đầu tiên cần nhập là `Mã hồ sơ` (hoặc `Tiêu đề` tùy cấu hình).

---

## 4. Kế hoạch xác thực (Verification Plan)

### Kiểm thử thủ công (Manual Testing)
1. **Kiểm tra Autocomplete**:
   * Click vào ô "Loại án", kiểm tra danh sách gợi ý hiển thị.
   * Gõ chữ "h", kiểm tra danh sách chỉ còn "Hình sự", "Hành chính", "Hôn nhân gia đình".
   * Sử dụng phím mũi tên đi xuống, bấm Enter để chọn. Kiểm tra xem focus có chuyển sang ô tiếp theo không.
2. **Kiểm tra Sticky Fields**:
   * Bật tùy chọn "Giữ lại thông tin cho hồ sơ tiếp theo".
   * Nhập hồ sơ: Loại án = "Hình sự", Năm = "2026", Bảo quản = "Vĩnh viễn", Hộp số = "BOX-006".
   * Bấm "Lưu hồ sơ".
   * Xác nhận form mới mở ra có sẵn Loại án = "Hình sự", Năm = "2026", Bảo quản = "Vĩnh viễn", Hộp số = "BOX-006", trong khi Tiêu đề và Bị cáo trống trơn.
   
### Tích hợp
* Đảm bảo kiểu dữ liệu đồng nhất giữa schema Prisma, DTOs và React forms.
