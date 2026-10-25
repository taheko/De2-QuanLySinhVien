# Kế Hoạch và Danh Mục Ca Kiểm Thử (Test Cases) - Đề 2

## 1. Mục tiêu kiểm thử
Xác nhận tính đúng đắn và an toàn của Hệ thống Quản lý Sinh viên (Đề 2) trên toàn bộ các tầng:
- Giao diện và Nghiệp vụ CRUD (Sinh viên, Lớp học, Điểm số).
- Ràng buộc toàn vẹn cơ sở dữ liệu MySQL (Khóa ngoại, Check constraint, Unique constraint).
- Reverse Proxy Nginx (Proxy pass, Security headers, Stub status).
- Hệ thống giám sát Prometheus và Grafana (cAdvisor, MySQL exporter, Nginx exporter).
- Hệ thống logging tập trung Grafana Loki & Promtail (LogQL queries).
- Hardening bảo mật và kiểm thử sao lưu/phục hồi (Backup & Restore).

---

## 2. Danh mục các ca kiểm thử chi tiết

| Mã ca kiểm thử | Tên ca kiểm thử | Mô tả & Thao tác | Kết quả kỳ vọng | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Health Check Endpoint | Gửi `GET /health` | HTTP 200, JSON `{status: "ok", database: "connected"}` | Đạt |
| **TC-02** | Xem danh sách sinh viên | Gửi `GET /students` | HTTP 200, hiển thị bảng sinh viên kèm lớp học | Đạt |
| **TC-03** | Tìm kiếm sinh viên | Gửi `GET /students?q=SV001` | HTTP 200, chỉ hiển thị kết quả SV001 | Đạt |
| **TC-04** | Thêm sinh viên hợp lệ | `POST /students` với thông tin đầy đủ | HTTP 302 chuyển hướng về danh sách, bản ghi lưu MySQL | Đạt |
| **TC-05** | Chặn sinh viên trùng mã | `POST /students` với mã sinh viên đã tồn tại | HTTP 409 Conflict hoặc thông báo lỗi trùng lặp | Đạt |
| **TC-06** | Kiểm tra validation sinh viên | `POST /students` bỏ trống mã sinh viên hoặc họ tên | HTTP 400 Bad Request | Đạt |
| **TC-07** | Sửa thông tin sinh viên | `POST /students/:id/edit` cập nhật họ tên/email | HTTP 302, dữ liệu cập nhật chính xác trong CSDL | Đạt |
| **TC-08** | Xóa sinh viên | `POST /students/:id/delete` | HTTP 302, sinh viên bị xóa khỏi danh sách | Đạt |
| **TC-09** | Thêm lớp học mới | `POST /classes` với mã lớp và tên lớp | HTTP 302, lớp mới xuất hiện trên danh sách | Đạt |
| **TC-10** | Chặn xóa lớp có sinh viên | `POST /classes/:id/delete` khi lớp còn sinh viên | HTTP 409, thông báo ràng buộc khóa ngoại (RESTRICT) | Đạt |
| **TC-11** | Nhập điểm hợp lệ (0-10) | `POST /grades` với điểm từ 0 đến 10 | HTTP 302, bản ghi lưu thành công | Đạt |
| **TC-12** | Chặn điểm ngoài thang 0-10 | `POST /grades` với điểm = 15 hoặc -2 | HTTP 400 hoặc lỗi Check constraint `chk_grades_score` | Đạt |
| **TC-13** | Chặn trùng điểm môn & kỳ | `POST /grades` nhập điểm trùng môn và học kỳ | HTTP 409 do vi phạm `uq_student_subject_semester` | Đạt |
| **TC-14** | Xử lý lỗi 404 Not Found | Gửi `GET /duong-dan-khong-ton-tai` | HTTP 404, hiển thị giao diện báo lỗi thân thiện | Đạt |
| **TC-15** | Nginx Security Headers | Kiểm tra response headers qua curl/browser | Có `nosniff`, `SAMEORIGIN`, `CSP`, ẩn `Server` | Đạt |
| **TC-16** | Nginx Stub Status | `GET http://nginx:80/stub_status` nội bộ | Trả về active connections, accepts, handled, requests | Đạt |
| **TC-17** | Prometheus 4 Targets UP | Truy vấn `http://localhost:9090/api/v1/targets` | Cả 4 targets `cadvisor`, `mysql`, `nginx`, `prometheus` đều `UP` | Đạt |
| **TC-18** | Grafana Dashboard | Truy cập `http://localhost:3000` | Dashboard tự nạp, hiển thị CPU, RAM, Network, DB | Đạt |
| **TC-19** | Loki & Promtail Logging | Truy vấn LogQL qua API/Explore | 3 queries (Nginx, HTTP >= 400, App events) đều có dữ liệu | Đạt |
| **TC-20** | Hardening Non-Root | `docker compose exec app id` | `uid=1000(node) gid=1000(node)` | Đạt |
| **TC-21** | Least Privilege MySQL | `SHOW GRANTS FOR 'student_app'@'%';` | Chỉ có quyền SELECT, INSERT, UPDATE, DELETE | Đạt |
| **TC-22** | Backup & Restore Checksum | Chạy backup và restore sang DB thử nghiệm | CHECKSUM TABLE của 4 bảng hoàn toàn trùng khớp | Đạt |
