# Tài liệu nâng cấp hệ thống ngày 21/05/2026

Tài liệu này tổng hợp các tính năng đã được cải thiện và bổ sung trong ngày 21/05/2026 cho hệ thống quản lý/chỉnh lý hồ sơ. Nội dung bao gồm cả phần Web Client `court-management` và API `court-management-api`.

## 1. Ghi nhận IP người dùng gọn hơn

### Đã nâng cấp

- Hệ thống không còn lưu nguyên chuỗi nhiều IP từ header `x-forwarded-for`.
- Khi request đi qua proxy/CDN/load balancer, hệ thống chỉ lưu một IP đại diện:
  - Ưu tiên `cf-connecting-ip` nếu có.
  - Nếu có `x-forwarded-for`, lấy IP đầu tiên trong chuỗi.
  - Nếu không có, dùng `x-real-ip`.
  - Nếu không xác định được, lưu `unknown`.

Ví dụ trước đây:

```text
115.76.51.82, 54.179.125.20, 162.158.189.66, 10.197.9.129
```

Sau nâng cấp sẽ lưu:

```text
115.76.51.82
```

### Cách sử dụng

Không cần thao tác thêm. Khi người dùng đăng nhập/đăng xuất hoặc thao tác tạo/sửa/xóa dữ liệu, IP được ghi tự động trong nhật ký.

Vào:

```text
Nhật ký hệ thống -> Lịch sử truy cập
```

để xem IP đã được rút gọn.

## 2. Lịch sử truy cập hệ thống nâng cao

### Đã nâng cấp

Phần lịch sử truy cập đã có thêm bộ lọc chi tiết:

- Tài khoản.
- Sự kiện đăng nhập/đăng xuất.
- Khoảng thời gian từ ngày/đến ngày.
- Loại thiết bị.
- Hệ điều hành.
- Trình duyệt.
- Tìm kiếm theo tài khoản, IP, thiết bị, user agent.

Hệ thống tiếp tục ghi nhận:

- Thời gian truy cập.
- Tài khoản.
- Sự kiện `LOGIN` hoặc `LOGOUT`.
- IP.
- User agent.
- Loại thiết bị.
- Hệ điều hành và phiên bản.
- Trình duyệt và phiên bản.

### Cách sử dụng

1. Đăng nhập bằng tài khoản `SUPER_ADMIN`.
2. Mở menu:

```text
Nhật ký -> Lịch sử truy cập
```

3. Sử dụng các ô lọc:
   - `Từ ngày`, `Đến ngày` để lọc theo thời gian.
   - `Thiết bị` để lọc `desktop`, `mobile`, `tablet`.
   - `HĐH` để lọc Windows, iOS, Android, macOS...
   - `Trình duyệt` để lọc Chrome, Safari, Edge...
4. Bấm `Đặt lại` để xóa toàn bộ bộ lọc.

### Lưu ý

- Web browser không cho phép lấy địa chỉ MAC thật của thiết bị. Vì vậy hệ thống không lưu MAC address.
- Thay vào đó hệ thống lưu metadata thiết bị, hệ điều hành, trình duyệt và user agent.

## 3. Nhật ký thao tác hệ thống nâng cao

### Đã nâng cấp

Nhật ký thao tác đã hỗ trợ lọc sâu hơn:

- Tìm kiếm chung.
- Hành động: tạo mới, cập nhật, xóa, đăng nhập, xuất dữ liệu...
- Đối tượng thao tác.
- IP.
- Khoảng thời gian.
- Tài khoản người dùng qua API.

### Cách sử dụng

1. Đăng nhập bằng `SUPER_ADMIN`.
2. Mở:

```text
Nhật ký -> Nhật ký thao tác
```

3. Lọc theo:
   - `Hành động`.
   - `Đối tượng`, ví dụ `File`, `BorrowSlip`, `Database`.
   - `IP`.
   - `Từ ngày`, `Đến ngày`.
4. Dùng ô tìm kiếm để tra nhanh theo người dùng, đối tượng, IP hoặc thông tin liên quan.

## 4. Quy trình mượn trả hồ sơ đúng luồng

### Đã nâng cấp

Trước đây khi tạo phiếu mượn, hồ sơ được chuyển ngay sang trạng thái đang mượn. Sau nâng cấp, hệ thống đã tách thành quy trình nghiệp vụ rõ ràng:

```text
Tạo yêu cầu -> Chờ duyệt -> Đã duyệt -> Xuất hồ sơ -> Đang mượn -> Trả hồ sơ
```

Các trạng thái phiếu mượn mới:

- `PENDING_APPROVAL`: chờ duyệt.
- `APPROVED`: đã duyệt.
- `REJECTED`: đã từ chối.
- `EXPORTED`: đã xuất hồ sơ, đang mượn.
- `PARTIAL_RETURN`: đã trả một phần.
- `RETURNED`: đã trả toàn bộ.
- `OVERDUE`: quá hạn.

Các trạng thái chi tiết hồ sơ trong phiếu:

- `REQUESTED`: đang được yêu cầu.
- `APPROVED`: đã duyệt.
- `BORROWING`: đang mượn.
- `RETURNED`: đã trả.

### Phân quyền sử dụng

- `COORDINATOR`:
  - Tạo yêu cầu mượn.
  - Xuất hồ sơ sau khi yêu cầu đã được duyệt.
  - Trả hồ sơ.
- `ADMIN` và `SUPER_ADMIN`:
  - Duyệt yêu cầu.
  - Từ chối yêu cầu.
  - Xem danh sách và lịch sử mượn trả.

### Cách tạo yêu cầu mượn

1. Vào danh sách hồ sơ.
2. Chọn hồ sơ cần mượn hoặc vào chi tiết hồ sơ.
3. Bấm `Lập phiếu mượn` hoặc `Tạo phiếu mượn`.
4. Nhập:
   - Người mượn.
   - Chức danh.
   - Lý do mượn.
   - Hạn trả.
   - Danh sách hồ sơ.
5. Bấm tạo phiếu.

Sau khi tạo, phiếu nằm ở tab:

```text
Mượn trả -> Chờ duyệt
```

Hồ sơ chưa bị chuyển sang `BORROWED` ở bước này.

### Cách duyệt hoặc từ chối yêu cầu

1. Đăng nhập bằng `ADMIN` hoặc `SUPER_ADMIN`.
2. Vào:

```text
Mượn trả -> Chờ duyệt
```

3. Với từng phiếu:
   - Bấm biểu tượng dấu tích để duyệt.
   - Bấm biểu tượng dấu X để từ chối.

Khi duyệt thành công, phiếu chuyển sang tab:

```text
Đã duyệt
```

### Cách xuất hồ sơ

1. Đăng nhập bằng tài khoản có quyền `COORDINATOR`.
2. Vào:

```text
Mượn trả -> Đã duyệt
```

3. Bấm nút xuất hồ sơ.

Sau khi xuất:

- Phiếu chuyển sang trạng thái `EXPORTED`.
- Hồ sơ liên quan chuyển sang trạng thái `BORROWED`.
- Phiếu nằm ở tab `Đang mượn`.

### Cách trả hồ sơ

1. Vào:

```text
Mượn trả -> Đang mượn
```

2. Bấm nút trả hồ sơ.
3. Chọn hồ sơ cần trả.
4. Nhập tình trạng, ghi chú và ngày trả nếu cần.
5. Xác nhận.

Nếu trả toàn bộ, phiếu chuyển sang `RETURNED`. Nếu trả một phần, phiếu chuyển sang `PARTIAL_RETURN`.

### Kiểm soát trùng mượn

Hệ thống không cho tạo yêu cầu mới nếu hồ sơ đang:

- Có yêu cầu chờ duyệt.
- Đã duyệt nhưng chưa xuất.
- Đang mượn.
- Trả một phần.
- Quá hạn.

Nhờ vậy mỗi hồ sơ chỉ có tối đa một luồng mượn hoạt động tại một thời điểm.

## 5. QR code khai thác hồ sơ an toàn

### Đã nâng cấp

Hệ thống đã có cơ chế QR token ký số:

- QR không chứa trực tiếp ID hồ sơ.
- Token có scope đọc hồ sơ.
- Token được ký bằng `JWT_SECRET`.
- Token có hạn sử dụng.
- Khi mở QR, hệ thống vẫn kiểm tra đăng nhập và phân quyền.

API mới:

```text
POST /api/files/:id/qr-token
GET  /api/qr/files/:token
```

Frontend mới:

```text
/qr/files/[token]
```

### Cách tạo QR/link khai thác hồ sơ

1. Vào chi tiết một hồ sơ.
2. Bấm nút `Tạo QR`.
3. Hệ thống tạo liên kết QR an toàn.
4. Nếu trình duyệt cho phép, liên kết được sao chép vào clipboard.
5. Có thể dùng liên kết này để tạo mã QR bằng công cụ in tem/nhãn bên ngoài hoặc tích hợp thêm thư viện sinh QR ở bước sau.

### Cách mở hồ sơ bằng QR

1. Người dùng quét QR hoặc mở liên kết dạng:

```text
/qr/files/<token>
```

2. Nếu chưa đăng nhập, cần đăng nhập trước.
3. Hệ thống kiểm tra quyền xem hồ sơ.
4. Nếu hợp lệ, hiển thị thông tin hồ sơ và nút mở chi tiết.

### Lưu ý bảo mật

- Production nên chạy HTTPS để camera API, cookie bảo mật và truyền tải dữ liệu hoạt động an toàn.
- Token QR bị sửa hoặc hết hạn sẽ bị từ chối.

## 6. Báo cáo và kết xuất dữ liệu

### Đã nâng cấp

Backend bổ sung các endpoint báo cáo:

```text
GET /api/reports/files
GET /api/reports/borrows
GET /api/reports/audit
GET /api/reports/export?type=files|borrows|audit&format=csv|xlsx
```

Frontend trang báo cáo đã có:

- Nút in báo cáo.
- Xuất CSV.
- Xuất Excel.
- Dashboard thống kê mượn trả hiện có.

### Cách sử dụng

1. Vào:

```text
Báo cáo -> Thống kê
```

2. Bấm:
   - `In` để mở chức năng in của trình duyệt.
   - `CSV` để tải báo cáo dạng `.csv`.
   - `Excel` để tải báo cáo dạng `.xlsx`.

Hiện nút xuất trên giao diện đang xuất báo cáo hồ sơ (`type=files`). API đã sẵn sàng để mở rộng giao diện chọn loại báo cáo mượn trả/audit.

## 7. Sao lưu, khôi phục và lịch sao lưu

### Đã nâng cấp

Hệ thống đã có thêm:

- Model `BackupSchedule`.
- Model `BackupRun`.
- API lấy/lưu lịch sao lưu.
- Ghi lịch sử backup/restore.
- UI cấu hình lịch sao lưu trong trang quản trị dữ liệu.

API mới:

```text
GET /api/admin/database/backup-schedule
PUT /api/admin/database/backup-schedule
```

### Cách sao lưu thủ công

1. Đăng nhập bằng `SUPER_ADMIN`.
2. Vào:

```text
Reset dữ liệu
```

3. Ở khối `Sao lưu cơ sở dữ liệu`, bấm:

```text
Tải xuống bản sao lưu
```

4. Hệ thống tải về file `.dump`.

### Cách khôi phục dữ liệu

1. Đăng nhập bằng `SUPER_ADMIN`.
2. Vào:

```text
Reset dữ liệu -> Khôi phục cơ sở dữ liệu
```

3. Chọn file `.dump`.
4. Nhập chính xác:

```text
RESTORE
```

5. Bấm khôi phục và xác nhận.

### Cách cấu hình lịch sao lưu

1. Vào:

```text
Reset dữ liệu -> Lịch sao lưu tự động
```

2. Chọn:
   - Bật hoặc tắt lịch.
   - Tần suất: hằng ngày hoặc hằng tuần.
   - Giờ chạy.
   - Số ngày lưu bản sao lưu.
3. Bấm `Lưu lịch sao lưu`.

### Lưu ý vận hành

Hiện hệ thống đã lưu cấu hình lịch sao lưu và lịch sử chạy backup/restore. Để backup tự động chạy đúng giờ trên production, cần bổ sung worker/cron job backend đọc cấu hình này và gọi chức năng backup theo lịch.

## 8. PWA cơ bản cho Web Client

### Đã nâng cấp

Web app đã có manifest:

```text
/manifest.webmanifest
```

Nội dung manifest gồm:

- Tên ứng dụng.
- Tên ngắn.
- Màu nền.
- Màu theme.
- Icon favicon.
- Chế độ hiển thị `standalone`.

### Cách sử dụng

Trên trình duyệt hỗ trợ PWA:

1. Mở web app.
2. Chọn `Install app` hoặc `Add to Home Screen`.
3. Ứng dụng có thể mở như một web app độc lập.

### Lưu ý

PWA hiện là mức cơ bản. Dữ liệu nghiệp vụ vẫn cần online. Chưa triển khai offline sync.

## 9. Các thay đổi database/API quan trọng

### Migration mới

Backend có migration:

```text
prisma/migrations/20260521020000_workflow_qr_reports_backup/migration.sql
```

Migration thêm:

- Metadata duyệt/từ chối/xuất hồ sơ vào `BorrowSlip`.
- Bảng `BackupSchedule`.
- Bảng `BackupRun`.

### Các trường mới trong BorrowSlip

```text
approvedById
approvedAt
rejectedById
rejectedAt
rejectReason
exportedById
exportedAt
```

### Các API mới

```text
POST /api/borrow/:id/approve
POST /api/borrow/:id/reject
POST /api/borrow/:id/export
POST /api/files/:id/qr-token
GET  /api/qr/files/:token
GET  /api/reports/files
GET  /api/reports/borrows
GET  /api/reports/audit
GET  /api/reports/export
GET  /api/admin/database/backup-schedule
PUT  /api/admin/database/backup-schedule
```

## 10. Kiểm thử đã chạy

Backend:

```bash
bun test && bun run build
```

Kết quả:

```text
58 pass
0 fail
tsc --noEmit pass
```

Frontend:

```bash
bun run build
```

Kết quả:

```text
Next.js build pass
Route /qr/files/[token] được build thành công
Route /manifest.webmanifest được build thành công
```

## 11. Những phần còn nên làm tiếp

Các phần dưới đây chưa phải lỗi, mà là bước tiếp theo để hoàn thiện production:

- Thêm background scheduler/cron job thật cho backup tự động.
- Thêm giao diện chọn loại báo cáo khi xuất: hồ sơ, mượn trả, audit.
- Thêm thư viện sinh QR trực tiếp thành ảnh để in tem.
- Thêm màn hình quét QR bằng camera trong web/mobile.
- Cải thiện layout mobile cho các bảng lớn thành dạng card/list.
- Thêm service worker cache sâu hơn nếu muốn offline một phần.
- Chuẩn hóa dữ liệu cũ từ trạng thái `BORROWING` sang `EXPORTED` sau khi chạy migration trên production.

