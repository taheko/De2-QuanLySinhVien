# ĐỀ 2 – HỆ THỐNG QUẢN LÝ SINH VIÊN

Học phần: **Triển khai và Quản trị Hệ thống Phần mềm**  
Đề tài: **Đề 2 – Hệ thống Quản lý Sinh viên, Lớp học và Điểm số**

---

## 1. Giới thiệu tổng quan
Hệ thống là một ứng dụng web quản lý sinh viên có đầy đủ chức năng CRUD (Thêm, Xem, Sửa, Xóa) cho sinh viên, lớp học và bảng điểm. Toàn bộ hệ thống được đóng gói và vận hành bằng Docker Compose với kiến trúc phân tầng an toàn:
- **Web Application**: Node.js + Express + EJS.
- **Database**: MySQL 8.4 (mạng nội bộ cách ly).
- **Database Management**: phpMyAdmin.
- **Reverse Proxy**: Nginx (cân bằng tải, bảo mật headers, giới hạn kích thước request).
- **Monitoring**: Prometheus, cAdvisor, MySQL exporter, Nginx exporter, Grafana.
- **Logging tập trung**: Grafana Loki, Promtail và truy vấn phân tích LogQL.
- **Bảo mật & Hardening**: Chạy quyền non-root, mạng database internal, nguyên tắc đặc quyền tối thiểu (Least Privilege), kiểm tra dữ liệu đầu vào và SQL tham số hóa (Parameterized SQL).
- **Sao lưu & Phục hồi**: Script sao lưu tự động và kiểm thử toàn vẹn bằng CHECKSUM TABLE.

---

## 2. Bảng phân bổ cổng dịch vụ

| Dịch vụ | Nền tảng / Image | Cổng Host | Vai trò & Phạm vi truy cập |
| :--- | :--- | :--- | :--- |
| **Nginx** | `nginx:1.28-alpine` | `8080` (HTTP) | Điểm tiếp nhận truy cập website duy nhất từ bên ngoài |
| **App (Node.js)** | `node:22-alpine` | *Không publish* (cổng 3000 nội bộ) | Xử lý nghiệp vụ CRUD sinh viên, lớp học, điểm số |
| **MySQL Database**| `mysql:8.4` | *Không publish* (cổng 3306 nội bộ) | Lưu trữ dữ liệu hệ thống, mạng `backend` cô lập |
| **phpMyAdmin** | `phpmyadmin:5` | `127.0.0.1:8081` | Quản trị giao diện CSDL nội bộ |
| **cAdvisor** | `ghcr.io/google/cadvisor:0.57.0` | *Không publish* | Thu thập metrics tài nguyên container (CPU, RAM, Network) |
| **MySQL Exporter** | `prom/mysqld-exporter:v0.17.2` | *Không publish* | Xuất chỉ số hiệu năng và kết nối của MySQL |
| **Nginx Exporter** | `nginx/nginx-prometheus-exporter:1.4.1` | *Không publish* | Đọc `stub_status` của Nginx để xuất request metrics |
| **Prometheus** | `prom/prometheus:v3.5.0` | `127.0.0.1:9090` | Thu thập time-series metrics từ 4 targets |
| **Grafana** | `grafana/grafana:11.6.0` | `127.0.0.1:3000` | Trực quan hóa dashboard giám sát và Explore log |
| **Loki** | `grafana/loki:3.5.1` | `127.0.0.1:3100` | Lưu trữ nhật ký hệ thống tập trung |
| **Promtail** | `grafana/promtail:3.5.1` | *Không publish* | Thu gom logs từ Docker socket và đẩy về Loki |

---

## 3. Cấu trúc thư mục dự án

```text
D:\De2_QuanLySinhVien/
├── app/
│   ├── public/
│   │   └── css/style.css        # Giao diện CSS hiện đại
│   ├── src/
│   │   ├── routes/              # Routes cho students, classes, grades
│   │   ├── db.js                # Kết nối MySQL Pool
│   │   └── server.js            # Express server và JSON middleware logger
│   ├── views/                   # Giao diện EJS (students, classes, grades, form)
│   ├── Dockerfile               # Đóng gói Node.js Alpine non-root
│   └── package.json
├── db/
│   └── init/
│       ├── 01-schema.sql        # Cấu trúc bảng và ràng buộc toàn vẹn
│       └── 02-seed.sql          # Dữ liệu ban đầu
├── nginx/
│   └── default.conf             # Cấu hình reverse proxy, headers, stub_status
├── monitoring/
│   ├── prometheus.yml           # Cấu hình scrape 4 targets
│   └── grafana/
│       └── provisioning/        # Tự động nạp datasources và dashboard
├── logging/
│   ├── loki-config.yml          # Cấu hình Loki lưu trữ log
│   └── promtail-config.yml      # Cấu hình thu gom log container
├── scripts/
│   ├── smoke.js                 # Kịch bản kiểm thử tự động CRUD
│   ├── backup.ps1 / backup.js   # Sao lưu CSDL MySQL
│   └── restore_test.ps1 / .js   # Phục hồi thử nghiệm và đối chiếu checksum
├── docs/                        # Tài liệu báo cáo và ảnh minh chứng
├── compose.yaml                 # File điều phối Docker Compose toàn hệ thống
├── .env.example                 # Mẫu cấu hình biến môi trường
└── .gitignore                   # Loại trừ secrets, logs, certs, backups
```

---

## 4. Hướng dẫn cài đặt và khởi chạy

### Bước 1: Chuẩn bị biến môi trường
Sao chép `.env.example` thành `.env` và đặt mật khẩu an toàn:
```bash
cp .env.example .env
```

### Bước 2: Khởi động hệ thống bằng Docker Compose
```bash
docker compose up -d --build
```

### Bước 3: Kiểm tra trạng thái dịch vụ
```bash
docker compose ps
curl http://localhost:8080/health
```

### Bước 4: Truy cập các giao diện
- **Website Quản lý Sinh viên**: [http://localhost:8080](http://localhost:8080)
- **phpMyAdmin**: [http://localhost:8081](http://localhost:8081)
- **Prometheus Targets**: [http://localhost:9090/targets](http://localhost:9090/targets)
- **Grafana Dashboard**: [http://localhost:3000](http://localhost:3000) (User/Pass từ file `.env`)

---

## 5. Quy trình kiểm thử và sao lưu
- **Chạy kiểm thử chức năng (Smoke Test)**:
  ```bash
  node scripts/smoke.js
  ```
- **Sao lưu cơ sở dữ liệu**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/backup.ps1
  ```
- **Kiểm thử phục hồi và so sánh Checksum**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/restore_test.ps1
  ```
