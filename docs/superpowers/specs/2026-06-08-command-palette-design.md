# Thiết kế Kỹ thuật: Command Palette & Phím tắt Gợi ý (Giai đoạn 1)

Thiết kế này nhằm nâng cấp trải nghiệm tương tác nhanh và hiệu quả nhập liệu cho người dùng thông qua hộp lệnh Command Palette toàn năng (Ctrl+K) cùng hệ thống tooltip chỉ dẫn phím tắt.

---

## 1. Yêu cầu & Mục tiêu

* **Command Palette (Ctrl+K)**:
  * Cho phép người dùng gọi mở từ bất kỳ trang nào trong hệ thống.
  * Tìm kiếm trực tiếp hồ sơ bằng cách gõ từ khóa (gọi API tìm kiếm).
  * Điều hướng nhanh đến các phân hệ (Hồ sơ, Mượn trả, Nhập liệu, Thống kê, v.v.).
  * Kích hoạt hành động nhanh (Mở modal Thêm mới hồ sơ, Chạy Sao lưu dữ liệu).
* **Shortcut Tooltips**:
  * Hiển thị hướng dẫn phím tắt tinh gọn khi rê chuột lên thanh tìm kiếm ở Header và các nút hành động cốt lõi.

---

## 2. Thiết kế Kỹ thuật chi tiết

### Component CommandPalette (`components/command-palette.tsx`)
* Sử dụng component `CommandDialog` (thư viện `cmdk`) đã định nghĩa sẵn trong `components/ui/command.tsx`.
* Component sẽ quản lý trạng thái đóng/mở `open` cục bộ.
* Đăng ký bộ lắng nghe sự kiện phím tắt toàn cục:
  ```tsx
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])
  ```

### Tìm kiếm hồ sơ thực tế
* Sử dụng `useState` và hook `useDebounce` để tránh gọi API liên tục (debounce 250ms).
* Sử dụng API `/api/files?q=keyword&limit=5` để tìm kiếm danh sách hồ sơ tương ứng.
* Hiển thị kết quả tìm kiếm dưới dạng danh sách `CommandItem`. Khi nhấn `Enter` hoặc click chuột, chuyển trang tới `/files/${file.id}` và tự động đóng palette.

### Tích hợp Hành động "Tạo mới hồ sơ"
* Để kích hoạt modal tạo mới từ bất kỳ trang nào mà không làm tăng độ phức tạp của DOM, chúng ta sẽ điều hướng tới trang chủ kèm tham số URL: `/` + `?create=true`.
* Tại `files-page.tsx`, thêm logic bắt param `create === 'true'`, mở modal và xóa sạch param đó khỏi URL.

---

## 3. Danh sách file thay đổi

* **[NEW]** [command-palette.tsx](file:///f:/projects/court-management/components/command-palette.tsx): Định nghĩa Command Palette dùng `cmdk` và Radix Dialog.
* **[MODIFY]** [main-layout.tsx](file:///f:/projects/court-management/src/layouts/main-layout.tsx): Mount global `CommandPalette`.
* **[MODIFY]** [header.tsx](file:///f:/projects/court-management/components/header.tsx): Thêm Tooltip chỉ dẫn phím tắt `Ctrl + K` cho ô tìm kiếm / nút tìm kiếm.
* **[MODIFY]** [files-page.tsx](file:///f:/projects/court-management/src/routes/files/files-page.tsx): Xử lý tham số truy vấn `create=true` để tự động kích hoạt modal Thêm mới hồ sơ.

---

## 4. Kế hoạch kiểm thử (Verification Plan)

### Kiểm thử thủ công:
1. Nhấn `Ctrl + K` hoặc `Cmd + K` ở bất cứ trang nào (Hồ sơ, Mượn trả) -> Command Palette mở ra.
2. Gõ từ khóa tìm kiếm hồ sơ -> danh sách hồ sơ xuất hiện -> chọn 1 hồ sơ và nhấn Enter -> chuyển hướng sang trang chi tiết hồ sơ thành công.
3. Chọn hành động "Tạo hồ sơ mới" -> chuyển hướng về trang chủ và modal thêm mới hồ sơ tự động mở ra.
4. Di chuột lên thanh tìm kiếm ở Header -> Tooltip hiển thị phím tắt gợi ý `Ctrl + K`.
