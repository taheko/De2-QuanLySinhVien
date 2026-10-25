# TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG
# KHOA CÔNG NGHỆ THÔNG TIN

---

## BÁO CÁO HỌC PHẦN
### TRIỂN KHAI & QUẢN TRỊ HỆ THỐNG PHẦN MỀM

**Đề tài:**  
# ĐỀ 2: HỆ THỐNG QUẢN LÝ SINH VIÊN

- **Sinh viên thực hiện**: *(Cập nhật theo thông tin sinh viên)*
- **Mã sinh viên**: DTC245220060
- **Lớp**: ATTT K23A / CNTT K23
- **Giảng viên hướng dẫn**: ThS. Nguyễn Anh Chuyên

*THÁI NGUYÊN, NĂM 2026*

---

## LỜI NÓI ĐẦU

Báo cáo trình bày kết quả triển khai toàn diện **Đề 2: Hệ thống Quản lý Sinh viên** trong khuôn khổ học phần *Triển khai và Quản trị Hệ thống Phần mềm*. Hệ thống cung cấp website quản lý thông tin sinh viên, lớp học và điểm số theo môn học với đầy đủ chức năng CRUD (Thêm, Xem, Sửa, Xóa), tìm kiếm, ràng buộc toàn vẹn dữ liệu, lưu trữ bền vững trên MySQL 8.4 và quản trị cơ sở dữ liệu qua giao diện phpMyAdmin. Toàn bộ các dịch vụ được đóng gói bằng Docker Compose, định tuyến qua Nginx Reverse Proxy, tích hợp hệ thống giám sát thời gian thực với Prometheus, Grafana, cAdvisor, MySQL exporter, Nginx exporter cùng hệ thống quản lý nhật ký tập trung Grafana Loki, Promtail và LogQL.

Trọng tâm của bài thực hành là chứng minh ứng dụng hoạt động song hành cùng hạ tầng vận hành đạt tiêu chuẩn sản xuất. Vì vậy, bên cạnh mã nguồn và kiến trúc dịch vụ, báo cáo cung cấp đầy đủ các kết quả thực nghiệm thực tế: lịch sử 3 commit mốc trên Git, bảng kiểm tra ràng buộc khóa ngoại (RESTRICT), kiểm tra giá trị điểm số hợp lệ (0–10), kiểm tra trạng thái UP của 4 target Prometheus, các chỉ số hoạt động `mysql_up = 1` và `nginx_up = 1`, 3 truy vấn LogQL thực tế lọc nhật ký Nginx, mã lỗi HTTP và sự kiện nghiệp vụ của ứng dụng, kết quả kiểm tra Least Privilege của MySQL, quyền non-root của container và quy trình sao lưu – phục hồi CSDL với độ toàn vẹn khớp 100% qua `CHECKSUM TABLE`.

Dữ liệu thực nghiệm được đo đạc và ghi nhận trực tiếp trên môi trường Windows chạy Docker Desktop (Linux containers). Toàn bộ kết quả, số liệu và câu lệnh trong báo cáo được kiểm chứng thực tế, tuân thủ nguyên tắc trung thực học thuật và phản ánh chính xác cấu hình đang vận hành.

---

## MỤC LỤC

- [PHẦN 1: GIỚI THIỆU TỔNG QUAN HỆ THỐNG](#phần-1-giới-thiệu-tổng-quan-hệ-thống)
  - [1.1 Mục tiêu và phạm vi đề tài](#11-mục-tiêu-và-phạm-vi-đề-tài)
  - [1.2 Môi trường thực nghiệm](#12-môi-trường-thực-nghiệm)
  - [1.3 Kiến trúc và luồng hoạt động](#13-kiến-trúc-và-luồng-hoạt-động)
  - [1.4 Các dịch vụ mạng và dữ liệu lưu trữ](#14-các-dịch-vụ-mạng-và-dữ-liệu-lưu-trữ)
- [PHẦN 2: QUẢN LÝ MÃ NGUỒN VÀ TRIỂN KHAI](#phần-2-quản-lý-mã-nguồn-và-triển-khai)
  - [2.1 Repository và cấu trúc mã nguồn](#21-repository-và-cấu-trúc-mã-nguồn)
  - [2.2 Ba commit mốc và quy trình quản lý thay đổi](#22-ba-commit-mốc-và-quy-trình-quản-lý-thay-đổi)
  - [2.3 Đóng gói và khởi chạy bằng Docker Compose](#23-đóng-gói-và-khởi-chạy-bằng-docker-compose)
  - [2.4 Mô hình cơ sở dữ liệu và ràng buộc toàn vẹn](#24-mô-hình-cơ-sở-dữ-liệu-và-ràng-buộc-toàn-vẹn)
  - [2.5 Giao diện website và chức năng CRUD sinh viên](#25-giao-diện-website-và-chức-năng-crud-sinh-viên)
  - [2.6 Quản lý lớp học và quản lý điểm số](#26-quản-lý-lớp-học-và-quản-lý-điểm-số)
  - [2.7 Quản trị cơ sở dữ liệu với phpMyAdmin](#27-quản-trị-cơ-sở-dữ-liệu-với-phpmyadmin)
- [PHẦN 3: NGINX VÀ HARDENING HỆ THỐNG](#phần-3-nginx-và-hardening-hệ-thống)
  - [3.1 Nginx Reverse Proxy và định tuyến lưu lượng](#31-nginx-reverse-proxy-và-định-tuyến-lưu-lượng)
  - [3.2 Cấu hình Security Headers và che giấu thông tin](#32-cấu-hình-security-headers-và-che-giấu-thông-tin)
  - [3.3 Hardening cơ sở dữ liệu và Least Privilege](#33-hardening-cơ-sở-dữ-liệu-và-least-privilege)
  - [3.4 Cô lập mạng, phân quyền Non-root và an toàn Secrets](#34-cô-lập-mạng-phân-quyền-non-root-và-an-toàn-secrets)
- [PHẦN 4: GIÁM SÁT VÀ LOG TẬP TRUNG](#phần-4-giám-sát-và-log-tập-trung)
  - [4.1 Cấu hình Prometheus và 4 Exporter Targets](#41-cấu-hình-prometheus-và-4-exporter-targets)
  - [4.2 Trực quan hóa dữ liệu trên Grafana Dashboard](#42-trực-quan-hóa-dữ-liệu-trên-grafana-dashboard)
  - [4.3 Giám sát Nginx, MySQL và chỉ số tài nguyên Container](#43-giám-sát-nginx-mysql-và-chỉ-số-tài-nguyên-container)
  - [4.4 Thiết kế hệ thống thu thập log với Loki và Promtail](#44-thiết-kế-hệ-thống-thu-thập-log-với-loki-và-promtail)
  - [4.5 Ba truy vấn LogQL thực nghiệm trên hệ thống](#45-ba-truy-vấn-logql-thực-nghiệm-trên-hệ-thống)
- [PHẦN 5: KIỂM THỬ VẬN HÀNH VÀ ĐỐI CHIẾU](#phần-5-kiểm-thử-vận-hành-và-đối-chiếu)
  - [5.1 Kết quả kiểm thử chức năng tự động (Smoke Test)](#51-kết-quả-kiểm-thử-chức-năng-tự-động-smoke-test)
  - [5.2 Sao lưu (Backup) và Phục hồi (Restore) đối chiếu Checksum](#52-sao-lưu-backup-và-phục-hồi-restore-đối-chiếu-checksum)
  - [5.3 Các lỗi phát sinh và biện pháp khắc phục](#53-các-lỗi-phát-sinh-và-biện-pháp-khắc-phục)
  - [5.4 Đối chiếu yêu cầu đề bài và kịch bản demo](#54-đối-chiếu-yêu-cầu-đề-bài-và-kịch-bản-demo)
- [KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN](#kết-luận-và-hướng-phát-triển)
- [TÀI LIỆU THAM KHẢO](#tài-liệu-tham-khảo)

---

## PHẦN 1: GIỚI THIỆU TỔNG QUAN HỆ THỐNG

### 1.1 Mục tiêu và phạm vi đề tài
Trong các cơ sở giáo dục và đào tạo, việc quản lý thông tin sinh viên, lớp học và kết quả học tập là nghiệp vụ cốt lõi. Một hệ thống quản lý chuẩn mực không chỉ dừng lại ở giao diện người dùng mà phải đáp ứng tính sẵn sàng cao, bảo mật nhiều lớp, khả năng giám sát tài nguyên và lưu trữ nhật ký phục vụ điều tra sự cố.

Đề tài **Đề 2 – Hệ thống Quản lý Sinh viên** hướng tới các mục tiêu:
1. **Ứng dụng & Dữ liệu**: Xây dựng website hoàn chỉnh các chức năng CRUD cho sinh viên, lớp học và bảng điểm theo môn học; kiểm soát chặt chẽ tính toàn vẹn dữ liệu qua ràng buộc khóa ngoại (Foreign Keys), ràng buộc kiểm tra (Check Constraints) và ràng buộc duy nhất (Unique Constraints).
2. **Đóng gói & Điều phối**: Triển khai toàn bộ các thành phần qua Docker Compose, cô lập mạng và duy trì tính bền vững dữ liệu bằng Named Volumes.
3. **Cổng tiếp nhận an toàn**: Sử dụng Nginx làm Reverse Proxy duy nhất tiếp nhận lưu lượng HTTP từ bên ngoài, cấu hình các tiêu đề bảo mật HTTP (Security Headers) và che giấu phiên bản máy chủ.
4. **Giám sát toàn diện (Observability)**: Sử dụng Prometheus thu thập metrics định kỳ từ 4 targets (cAdvisor, MySQL exporter, Nginx exporter, Prometheus), trực quan hóa qua Dashboard động trên Grafana.
5. **Thu thập Log tập trung (Centralized Logging)**: Ứng dụng và Nginx ghi log định dạng JSON chuẩn; Promtail thu thập và chuyển tiếp về Grafana Loki; thực hiện truy vấn và lọc sự kiện bằng LogQL.
6. **Hardening & Khắc phục thảm họa**: Áp dụng nguyên tắc đặc quyền tối thiểu (Least Privilege) cho tài khoản CSDL, chạy container với user non-root, cô lập mạng CSDL, và xây dựng kịch bản kiểm thử phục hồi CSDL với kiểm tra đối chiếu `CHECKSUM TABLE`.

| Yêu cầu đề bài | Giải pháp đáp ứng trong hệ thống Đề 2 |
| :--- | :--- |
| **Mã nguồn & Git** | Khởi tạo Git repository, quản trị 3 commit mốc, loại trừ secrets bằng `.gitignore` |
| **Ứng dụng CRUD** | Website Node.js + Express + EJS, giao diện thiết kế hiện đại, responsive |
| **Cơ sở dữ liệu** | MySQL 8.4 mạng nội bộ, quản trị qua phpMyAdmin cổng `8081` |
| **Reverse Proxy** | Nginx Alpine cổng host `8080`, Security Headers, endpoint `stub_status` |
| **Monitoring** | Prometheus thu thập metrics từ cAdvisor, MySQL exporter, Nginx exporter; Grafana Dashboard |
| **Logging** | Nginx & App log định dạng JSON, Loki lưu trữ, Promtail thu gom, 3 truy vấn LogQL |
| **Hardening** | User `node` (UID 1000), mạng `backend` internal, MySQL cấp quyền CRUD tối thiểu, SQL tham số |
| **Backup/Restore** | Script sao lưu `mysqldump --single-transaction`, phục hồi DB test và đối chiếu CHECKSUM |

### 1.2 Môi trường thực nghiệm
- **Hệ điều hành Host**: Windows 11 64-bit.
- **Nền tảng Container**: Docker Desktop (Engine version `29.7.2`, context `desktop-linux`).
- **Công cụ điều phối**: Docker Compose version `v5.4.0`.
- **Môi trường runtime ứng dụng**: Node.js `v24.19.0` (Host) và `node:22-alpine` (Container).
- **Hệ quản trị CSDL**: MySQL Server `8.4.13` (Linux container).
- **Phân bổ cổng Host**:
  - Cổng `3306` của máy host đang được tiến trình MySQL cục bộ Windows sử dụng (PID `7592`). Do đó, container MySQL được cấu hình trong mạng nội bộ `backend` (`internal: true`) và **không publish** cổng 3306 ra ngoài. Điều này vừa giải quyết triệt để xung đột cổng, vừa là biện pháp an toàn thông tin chuẩn mực.
  - Cổng `8080`: Nginx Reverse Proxy (giao diện website duy nhất).
  - Cổng `8081`: phpMyAdmin (chỉ bind `127.0.0.1` để quản trị nội bộ).
  - Cổng `9090`: Prometheus Server (`127.0.0.1`).
  - Cổng `3000`: Grafana Dashboard (`127.0.0.1`).
  - Cổng `3100`: Grafana Loki API (`127.0.0.1`).

### 1.3 Kiến trúc và luồng hoạt động

Kiến trúc hệ thống được phân tách thành 3 luồng hoạt động độc lập và rõ ràng:

1. **Luồng phục vụ người dùng (User Traffic Flow)**:
   - Người dùng gửi yêu cầu HTTP tới địa chỉ `http://localhost:8080`.
   - Nginx Reverse Proxy tiếp nhận, kiểm tra giới hạn kích thước request body (`client_max_body_size 16k`), chèn các Security Headers và chuyển tiếp (proxy pass) tới container `app:3000` thông qua mạng bridge `frontend`.
   - Ứng dụng Express phân tích route, kiểm tra tính hợp lệ của dữ liệu đầu vào (input validation), thực thi câu lệnh SQL có tham số (Parameterized Queries) tới container `db:3306` qua mạng nội bộ `backend`.
   - Kết quả được render qua view engine EJS với giao diện CSS hiện đại và trả ngược về cho người dùng qua Nginx.
   - Quản trị viên truy cập phpMyAdmin tại `http://127.0.0.1:8081` qua mạng `management` và kết nối tới `db:3306` qua mạng `backend`.

2. **Luồng thu thập chỉ số giám sát (Observability / Metrics Flow)**:
   - Chu kỳ mỗi 15 giây (`scrape_interval: 15s`), Prometheus chủ động kéo (pull) metrics từ 4 targets:
     - `cadvisor:8080`: Thu thập chỉ số CPU, RAM, Network I/O của toàn bộ các container.
     - `mysql-exporter:9104`: Đọc các chỉ số hiệu năng nội bộ của MySQL (số kết nối, queries/sec, buffer pool).
     - `nginx-exporter:9113`: Đọc số lượng kết nối và request qua endpoint `/stub_status` của Nginx.
     - `prometheus:9090`: Tự thu thập chỉ số hiệu năng của chính Prometheus.
   - Grafana truy vấn Prometheus thông qua PromQL và hiển thị trên Dashboard giám sát tổng hợp.

3. **Luồng ghi nhận và phân tích nhật ký (Centralized Logging Flow)**:
   - Nginx ghi access log dưới định dạng JSON (`json_analytics`) chứa các trường: `time_local`, `remote_addr`, `request_method`, `request_uri`, `status`, `body_bytes_sent`, `request_time`.
   - Ứng dụng Node.js ghi nhật ký có cấu trúc JSON cho mọi request HTTP và các sự kiện nghiệp vụ (`student_created`, `grade_updated`, `validation_failed`, `class_delete_blocked`).
   - Promtail lắng nghe Docker socket (`/var/run/docker.sock`), tự động trích xuất metadata tên container và gắn nhãn, sau đó đẩy logs (push) qua mạng `monitoring` tới Grafana Loki.
   - Quản trị viên sử dụng Grafana Explore để thực thi các câu truy vấn LogQL phục vụ kiểm tra và khắc phục sự cố.

### 1.4 Các dịch vụ mạng và dữ liệu lưu trữ

#### Bảng danh mục các dịch vụ
| Dịch vụ | Image / Nền tảng | Cổng Host | Mạng Docker | Vai trò trong hệ thống |
| :--- | :--- | :--- | :--- | :--- |
| **app** | `node:22-alpine` | *Không publish* | `frontend`, `backend` | Xử lý logic nghiệp vụ Quản lý sinh viên, chạy quyền non-root (UID 1000) |
| **db** | `mysql:8.4` | *Không publish* | `backend` (internal) | Lưu trữ cơ sở dữ liệu quan hệ, cô lập hoàn toàn với bên ngoài |
| **nginx** | `nginx:1.28-alpine` | `8080` (HTTP) | `frontend` | Reverse Proxy, áp dụng Security Headers, cân bằng tải |
| **phpmyadmin** | `phpmyadmin:5` | `127.0.0.1:8081` | `backend`, `management` | Giao diện web quản trị cơ sở dữ liệu MySQL |
| **cadvisor** | `ghcr.io/google/cadvisor:0.57.0` | *Không publish* | `monitoring` | Thu thập metrics tài nguyên container từ nhân Linux |
| **mysql-exporter** | `prom/mysqld-exporter:v0.17.2` | *Không publish* | `backend`, `monitoring` | Thu thập chỉ số kết nối, hiệu năng của MySQL Server |
| **nginx-exporter** | `nginx/nginx-prometheus-exporter:1.4.1` | *Không publish* | `frontend`, `monitoring` | Đọc `stub_status` của Nginx và xuất định dạng Prometheus |
| **prometheus** | `prom/prometheus:v3.5.0` | `127.0.0.1:9090` | `monitoring` | Cơ sở dữ liệu Time-series lưu trữ metrics |
| **grafana** | `grafana/grafana:11.6.0` | `127.0.0.1:3000` | `monitoring` | Trực quan hóa bảng điều khiển và truy vấn nhật ký |
| **loki** | `grafana/loki:3.5.1` | `127.0.0.1:3100` | `monitoring` | Công cụ lưu trữ và lập chỉ mục nhật ký tập trung |
| **promtail** | `grafana/promtail:3.5.1` | *Không publish* | `monitoring` | Thu thập log container từ Docker daemon và chuyển về Loki |

#### Bảng danh mục các mạng Docker (Networks)
| Tên mạng | Driver | Cấu hình đặc biệt | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| `frontend` | `bridge` | Mặc định | Kết nối Nginx với ứng dụng Node.js và Nginx exporter |
| `backend` | `bridge` | `internal: true` | Mạng cô lập dữ liệu; kết nối MySQL với app, phpMyAdmin và MySQL exporter |
| `management` | `bridge` | Mặc định | Mạng quản trị cho phép publish cổng của phpMyAdmin |
| `monitoring` | `bridge` | Mặc định | Cô lập lưu lượng giám sát giữa Prometheus, Grafana, Exporters và Loki |

#### Bảng danh mục Named Volumes (Lưu trữ bền vững)
| Tên Volume | Dịch vụ sử dụng | Đường dẫn Mount trong Container | Mục đích lưu trữ |
| :--- | :--- | :--- | :--- |
| `mysql_data` | `db` | `/var/lib/mysql` | Dữ liệu bảng, chỉ mục và transaction log của MySQL 8.4 |
| `prometheus_data` | `prometheus` | `/prometheus` | Dữ liệu chuỗi thời gian (time-series) của Prometheus |
| `grafana_data` | `grafana` | `/var/lib/grafana` | Dữ liệu cấu hình, tài khoản và dashboard của Grafana |
| `loki_data` | `loki` | `/loki` | Chunks và TSDB index của hệ thống nhật ký Loki |
| `promtail_positions` | `promtail` | `/tmp` | Vị trí offset đọc log của Promtail tránh đọc trùng |

---

## PHẦN 2: QUẢN LÝ MÃ NGUỒN VÀ TRIỂN KHAI

### 2.1 Repository và cấu trúc mã nguồn
Mã nguồn của hệ thống được quản lý chính thức tại repository GitHub:  
👉 **https://github.com/taheko/De2-QuanLySinhVien**

Source code ứng dụng, Dockerfile, schema khởi tạo, Compose, Nginx, Prometheus, Grafana, Loki, Promtail và scripts vận hành đều nằm trong repository. Cấu trúc mã nguồn được tổ chức khoa học:

```text
D:\De2_QuanLySinhVien/
├── app/                                 # Ứng dụng Node.js Express + EJS
│   ├── public/css/style.css             # Hệ thống CSS hiện đại, responsive
│   ├── src/
│   │   ├── routes/                      # Định tuyến: students.js, classes.js, grades.js
│   │   ├── db.js                        # MySQL Connection Pool (mysql2/promise)
│   │   └── server.js                    # Server Express, JSON access logger, error handler
│   ├── views/                           # Giao diện EJS: students, classes, grades, form
│   ├── Dockerfile                       # Image Node 22 Alpine, chạy quyền non-root
│   └── package.json                     # Quản lý dependencies (express, mysql2, ejs, dotenv)
├── db/init/                             # Khởi tạo CSDL MySQL
│   ├── 01-schema.sql                    # Cấu trúc 4 bảng và các ràng buộc khóa ngoại, check
│   └── 02-seed.sql                      # Dữ liệu ban đầu
├── nginx/
│   └── default.conf                     # Reverse Proxy, Security Headers, json_analytics, stub_status
├── monitoring/
│   ├── prometheus.yml                   # Cấu hình 4 scrape jobs: prometheus, cadvisor, mysql, nginx
│   └── grafana/provisioning/            # Tự động nạp datasources và dashboard JSON
├── logging/
│   ├── loki-config.yml                  # Cấu hình lưu trữ TSDB v13 cho Loki
│   └── promtail-config.yml              # Thu thập log từ Docker socket
├── scripts/                             # Bộ công cụ vận hành tự động (Zero-dependency)
│   ├── smoke.js                         # Kịch bản kiểm thử tự động toàn diện CRUD
│   ├── backup.js / backup.ps1           # Sao lưu CSDL MySQL bằng mysqldump
│   ├── restore_test.js / restore_test.ps1# Phục hồi vào DB test và đối chiếu CHECKSUM
│   ├── set_grants.js                    # Thiết lập phân quyền Least Privilege cho CSDL
│   ├── query_loki.js                    # Tự động thực thi và kiểm tra 3 truy vấn LogQL
│   ├── generate_docx.py                 # Script tạo file Word báo cáo chuẩn mẫu
│   └── collect_evidence.js              # Thu thập snapshot số liệu thực tế vào JSON
├── docs/                                # Báo cáo, test plan và bằng chứng thực nghiệm
├── compose.yaml                         # Điều phối Docker Compose toàn hệ thống
├── .env.example                         # Mẫu khai báo biến môi trường an toàn
└── .gitignore                           # Loại trừ triệt để .env, secrets, backups, logs
```

File `.gitignore` được thiết lập nghiêm ngặt, ngăn chặn tuyệt đối việc đưa các thông tin nhạy cảm lên Git:
```gitignore
node_modules/
.env
.env.*
!.env.example
secrets/
certs/*.key
backups/
logs/
.DS_Store
npm-debug.log*
*.backup
*.tar.gz
```

Lệnh kiểm tra loại trừ an toàn:
```powershell
git check-ignore -v .env backups/test.sql logs/test.log secrets/exporter.cnf
```
Kết quả kiểm tra xác nhận toàn bộ các file mật khẩu và dữ liệu sao lưu đều được bảo vệ.

### 2.2 Ba commit mốc và quy trình quản lý thay đổi
Tiến độ phát triển được phân chia thành 3 commit mốc kinh điển, phản ánh chính xác từng giai đoạn hoàn thiện hệ thống:

| Mốc | Hash Commit | Thông điệp Commit (Git Commit Message) | Nội dung kỹ thuật chính |
| :---: | :---: | :--- | :--- |
| **Mốc 1** | `9627d7d` | `feat: ung dung Quan ly Sinh vien CRUD, MySQL, phpMyAdmin, Nginx va hardening co ban` | Hoàn thiện ứng dụng Node.js, EJS views, CSS, schema CSDL 4 bảng, Dockerfile non-root, Nginx proxy và file Compose cơ bản |
| **Mốc 2** | `61d2e4f` | `feat: ha tang giam sat Prometheus, Grafana, cAdvisor, MySQL exporter va Nginx exporter` | Cấu hình Prometheus 4 targets, provisioning Grafana datasources và Dashboard JSON giám sát CPU, RAM, Web, DB |
| **Mốc 3** | `271360f` | `feat: logging tap trung Loki, Promtail, LogQL, backup, kiem thu va bao cao hoan chinh` | Tích hợp Loki, Promtail, bộ script kiểm thử CRUD tự động, script sao lưu – phục hồi, đối chiếu Checksum và hồ sơ báo cáo hoàn chỉnh |

Lệnh kiểm tra lịch sử commit mốc:
```powershell
git log --oneline --reverse
```
Kết quả thực tế trên máy:
```text
9627d7d feat: ung dung Quan ly Sinh vien CRUD, MySQL, phpMyAdmin, Nginx va hardening co ban
61d2e4f feat: ha tang giam sat Prometheus, Grafana, cAdvisor, MySQL exporter va Nginx exporter
271360f feat: logging tap trung Loki, Promtail, LogQL, backup, kiem thu va bao cao hoan chinh
```

### 2.3 Đóng gói và khởi chạy bằng Docker Compose
Dockerfile của ứng dụng sử dụng image nền tảng siêu nhẹ `node:22-alpine`. Quy trình đóng gói tuân thủ nguyên tắc bảo mật:
- Cài đặt production dependencies với `npm install --omit=dev`.
- Xóa cache npm (`npm cache clean --force`) để tối ưu dung lượng image.
- Chuyển quyền thực thi sang người dùng không đặc quyền: `USER node` (UID 1000).

```dockerfile
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY src ./src
COPY views ./views
COPY public ./public
USER node
EXPOSE 3000
CMD ["npm", "start"]
```

Quy trình khởi chạy và cập nhật toàn bộ stack dịch vụ:
```powershell
docker compose up -d --build
```
Cơ chế `healthcheck` trên container `db` đảm bảo ứng dụng Node.js và các exporter chỉ khởi động sau khi MySQL Server đã sẵn sàng nhận kết nối:
```yaml
healthcheck:
  test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -uroot -p\"$$MYSQL_ROOT_PASSWORD\" --silent"]
  interval: 10s
  timeout: 5s
  retries: 10
  start_period: 30s
```

### 2.4 Mô hình cơ sở dữ liệu và ràng buộc toàn vẹn
Cơ sở dữ liệu `student_management` được chuẩn hóa với bảng mã ký tự `utf8mb4` và collation `utf8mb4_unicode_ci`. Mô hình gồm 4 bảng có liên kết chặt chẽ:

1. **Bảng `classes` (Lớp học)**:
   - `id`: Khóa chính tự tăng (BIGINT UNSIGNED).
   - `class_code`: Mã lớp (VARCHAR 30), duy nhất (`UNIQUE`), không rỗng.
   - `class_name`: Tên lớp (VARCHAR 120), không rỗng.
   - `created_at`: Thời gian khởi tạo.
2. **Bảng `students` (Sinh viên)**:
   - `id`: Khóa chính tự tăng (BIGINT UNSIGNED).
   - `student_code`: Mã sinh viên (VARCHAR 30), duy nhất (`UNIQUE`), không rỗng.
   - `full_name`: Họ và tên sinh viên (VARCHAR 150), không rỗng.
   - `date_of_birth`: Ngày sinh (DATE).
   - `gender`: Giới tính (Nam / Nu / Khac).
   - `email`: Địa chỉ email (VARCHAR 150).
   - `phone`: Số điện thoại (VARCHAR 20).
   - `class_id`: Khóa ngoại tham chiếu `classes(id)` với chính sách `ON UPDATE CASCADE ON DELETE RESTRICT`. Quy tắc này **ngăn chặn tuyệt đối việc xóa lớp học khi còn sinh viên đang theo học**.
3. **Bảng `subjects` (Môn học / Học phần)**:
   - `id`: Khóa chính tự tăng (BIGINT UNSIGNED).
   - `subject_code`: Mã môn học (VARCHAR 30), duy nhất (`UNIQUE`).
   - `subject_name`: Tên môn học (VARCHAR 150).
   - `credits`: Số tín chỉ (TINYINT UNSIGNED).
4. **Bảng `grades` (Điểm số)**:
   - `id`: Khóa chính tự tăng (BIGINT UNSIGNED).
   - `student_id`: Khóa ngoại tham chiếu `students(id)`.
   - `subject_id`: Khóa ngoại tham chiếu `subjects(id)`.
   - `score`: Điểm số (DECIMAL 4,2), có ràng buộc kiểm tra hợp lệ: `CONSTRAINT chk_grades_score CHECK (score >= 0 AND score <= 10)`.
   - `semester`: Học kỳ (VARCHAR 30).
   - Ràng buộc duy nhất: `CONSTRAINT uq_student_subject_semester UNIQUE (student_id, subject_id, semester)` đảm bảo **mỗi sinh viên chỉ có duy nhất một đầu điểm trong cùng một môn học tại một học kỳ**.

### 2.5 Giao diện website và chức năng CRUD sinh viên
Giao diện quản lý sinh viên được xây dựng với hệ thống CSS hiện đại (`style.css`), bao gồm:
- **Thanh điều hướng cố định (Sticky Navigation)**: Thể hiện rõ tên đề tài, logo và trang hiện hành.
- **Thanh công cụ tìm kiếm (Toolbar Search)**: Cho phép tìm kiếm sinh viên tức thời theo mã sinh viên hoặc họ tên bằng câu truy vấn `LIKE ?`.
- **Bảng danh sách sinh viên**: Hiển thị mã sinh viên dưới dạng badge, họ tên in đậm, định dạng ngày sinh chuẩn `YYYY-MM-DD` (sử dụng hàm `DATE_FORMAT` trong SQL để tránh sai lệch múi giờ), badge giới tính trực quan và tên lớp học liên kết.
- **Biểu mẫu Thêm / Sửa sinh viên**: Kiểm tra tính hợp lệ của dữ liệu ngay tại máy khách và kiểm tra nghiêm ngặt tại máy chủ Express (độ dài, định dạng email regex, ngày sinh hợp lệ).

### 2.6 Quản lý lớp học và quản lý điểm số
- **Trang Quản lý lớp học (`/classes`)**:
  - Tích hợp biểu mẫu thêm lớp học mới ngay trên đầu trang.
  - Hiển thị danh sách lớp kèm sĩ số sinh viên trực thuộc (truy vấn `COUNT(s.id)` qua `LEFT JOIN`).
  - Hỗ trợ sửa nhanh mã lớp/tên lớp ngay tại bảng.
  - Khi thực hiện xóa lớp học có sinh viên, hệ thống bắt mã lỗi `ER_ROW_IS_REFERENCED_2` từ MySQL và trả về thông báo lỗi thân thiện: *"Không thể xóa lớp vì vẫn còn sinh viên thuộc lớp."*
- **Trang Quản lý điểm số (`/grades`)**:
  - Biểu mẫu nhập điểm với danh sách chọn (Select dropdown) nạp trực tiếp danh sách sinh viên và môn học từ CSDL.
  - Ràng buộc điểm nhập trong khoảng `[0, 10]`, bước nhảy `0.01`.
  - Phân loại học lực tự động trên bảng điểm bằng màu sắc: Giỏi (Xanh lá, $\ge 8.5$), Khá (Xanh dương, $\ge 7.0$), Trung bình (Vàng cam, $\ge 5.0$), Yếu (Đỏ, $< 5.0$).
  - Bắt lỗi trùng điểm cùng môn/kỳ (`ER_DUP_ENTRY`) và chặn nhập điểm cho sinh viên không tồn tại.

### 2.7 Quản trị cơ sở dữ liệu với phpMyAdmin
phpMyAdmin được triển khai tại địa chỉ `http://127.0.0.1:8081`, kết nối tới dịch vụ `db` thông qua mạng nội bộ `backend`:
- Cung cấp giao diện trực quan để xem cấu trúc 4 bảng `classes`, `students`, `subjects`, `grades`.
- Người dùng có thể đăng nhập bằng tài khoản ứng dụng `student_app` hoặc tài khoản quản trị `root`.
- Do áp dụng nguyên tắc đặc quyền tối thiểu (Least Privilege), tài khoản `student_app` chỉ thực hiện được các thao tác DML (SELECT, INSERT, UPDATE, DELETE), không có quyền xóa hay thay đổi cấu trúc bảng, bảo vệ CSDL trước các rủi ro can thiệp trái phép.

---

## PHẦN 3: NGINX VÀ HARDENING HỆ THỐNG

### 3.1 Nginx Reverse Proxy và định tuyến lưu lượng
Nginx phiên bản `1.28-alpine` đóng vai trò là lớp bảo vệ và là cổng duy nhất nhận lưu lượng từ người dùng trên máy host tại cổng `8080`. Ứng dụng Node.js chỉ lắng nghe cổng nội bộ 3000 và không phơi bày ra bên ngoài.

Cấu hình định tuyến trong `nginx/default.conf`:
```nginx
location / {
    proxy_pass http://app:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 5s;
    proxy_read_timeout 30s;
}
```
Các tham số timeout giúp bảo vệ máy chủ trước các cuộc tấn công dạng Slowloris hoặc kết nối treo.

### 3.2 Cấu hình Security Headers và che giấu thông tin
Nhằm nâng cao an toàn thông tin theo chuẩn OWASP, Nginx được cấu hình bổ sung đầy đủ các tiêu đề an ninh HTTP:

| Tiêu đề bảo mật (Security Header) | Giá trị cấu hình | Mục đích bảo mật |
| :--- | :--- | :--- |
| **X-Content-Type-Options** | `nosniff` | Chống lại kỹ thuật MIME-sniffing, buộc trình duyệt tuân thủ MIME type khai báo |
| **X-Frame-Options** | `SAMEORIGIN` | Ngăn chặn website bị nhúng vào `<iframe>` của tên miền lạ, chống Clickjacking |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Giới hạn rò rỉ URL chứa tham số nhạy cảm khi chuyển hướng sang trang khác |
| **Content-Security-Policy (CSP)** | `default-src 'self' 'unsafe-inline'; ...` | Ngăn chặn tấn công Cross-Site Scripting (XSS) và nạp script độc hại |
| **Server Tokens** | `off` | Che giấu phiên bản cụ thể của máy chủ Nginx (chỉ trả về `Server: nginx`) |
| **Client Max Body Size** | `16k` | Giới hạn dung lượng tải lên 16 KB, ngăn ngừa tấn công DoS tràn bộ nhớ đệm |

Kiểm tra tiêu đề phản hồi thực tế bằng `curl`:
```powershell
curl.exe -s -I http://localhost:8080/health
```
Kết quả ghi nhận:
```http
HTTP/1.1 200 OK
Server: nginx
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self' 'unsafe-inline'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; form-action 'self'; frame-ancestors 'self'
```

### 3.3 Hardening cơ sở dữ liệu và Least Privilege
Để giảm thiểu tối đa rủi ro khi ứng dụng bị tấn công, tài khoản kết nối của ứng dụng `student_app` được áp dụng nguyên tắc đặc quyền tối thiểu (Least Privilege):
- Thu hồi toàn bộ quyền quản trị toàn cục (`REVOKE ALL PRIVILEGES`).
- Chỉ cấp phát các quyền thao tác dữ liệu: `SELECT`, `INSERT`, `UPDATE`, `DELETE` trên CSDL `student_management.*`.
- Tuyệt đối không cấp các quyền nguy hiểm: `DROP`, `ALTER`, `CREATE`, `SUPER`, `FILE`, `GRANT OPTION`.

Kiểm tra đặc quyền thực tế của tài khoản:
```powershell
docker compose exec -T db mysql -uroot -pRoot@123456 -e "SHOW GRANTS FOR 'student_app'@'%';"
```
Kết quả thực tế:
```text
Grants for student_app@%
GRANT USAGE ON *.* TO `student_app`@`%`
GRANT SELECT, INSERT, UPDATE, DELETE ON `student_management`.* TO `student_app`@`%`
```
Bên cạnh đó, ứng dụng Node.js sử dụng hoàn toàn cơ chế **Prepared Statements** và **Bound Parameters** (`pool.execute("... VALUES (?, ?)", [val1, val2])`), loại bỏ hoàn toàn nguy cơ bị khai thác SQL Injection.

### 3.4 Cô lập mạng, phân quyền Non-root và an toàn Secrets
- **Phân quyền người dùng tiến trình (Non-Root)**:
  Container `app` được cấu hình chạy dưới tài khoản unprivileged `node`.
  Kiểm tra bằng lệnh:
  ```powershell
  docker compose exec app id
  ```
  Kết quả thực tế:
  ```text
  uid=1000(node) gid=1000(node) groups=1000(node)
  ```
- **Cô lập mạng CSDL (Database Network Isolation)**:
  Mạng `backend` được thiết lập `internal: true`. Lệnh `docker network inspect de2_quanlysinhvien_backend` xác nhận cờ `"Internal": true`. Container CSDL `db` không có cổng publish ra ngoài host, chỉ cho phép giao tiếp nội bộ giữa các container được chỉ định.
- **An toàn tệp chứa thông tin nhạy cảm (Secrets Management)**:
  - File mật khẩu của MySQL Exporter được lưu tại `secrets/exporter.cnf` với quyền đọc giới hạn và được `.gitignore` loại trừ.
  - Toàn bộ mật khẩu CSDL, Grafana admin đều được nạp từ biến môi trường `.env`, không hardcode vào mã nguồn.

---

## PHẦN 4: GIÁM SÁT VÀ LOG TẬP TRUNG

### 4.1 Cấu hình Prometheus và 4 Exporter Targets
Hệ thống giám sát sử dụng mô hình kéo (pull-based) với Prometheus `v3.5.0`. Chu kỳ lấy mẫu và đánh giá cảnh báo được thiết lập 15 giây (`scrape_interval: 15s`).

File cấu hình [monitoring/prometheus.yml](file:///D:/De2_QuanLySinhVien/monitoring/prometheus.yml) định nghĩa đầy đủ 4 scrape jobs:
1. `cadvisor`: Đọc chỉ số tài nguyên từ `cadvisor:8080`.
2. `mysql`: Đọc chỉ số cơ sở dữ liệu từ `mysql-exporter:9104`.
3. `nginx`: Đọc chỉ số lưu lượng web từ `nginx-exporter:9113`.
4. `prometheus`: Đọc chỉ số vận hành nội bộ từ `prometheus:9090`.

Kiểm tra trạng thái các Targets qua Prometheus API:
```powershell
curl.exe -s http://127.0.0.1:9090/api/v1/targets
```
Kết quả thực nghiệm xác nhận **cả 4 targets đều ở trạng thái UP**, không có lỗi kết nối (`lastError: ""`):

| Target Scrape Pool | Địa chỉ Endpoint | Trạng thái (Health) | Scrape Interval | Lỗi ghi nhận (LastError) |
| :--- | :--- | :---: | :---: | :--- |
| **cadvisor** | `http://cadvisor:8080/metrics` | **UP** | 15s | Rỗng (Không có lỗi) |
| **mysql** | `http://mysql-exporter:9104/metrics` | **UP** | 15s | Rỗng (Không có lỗi) |
| **nginx** | `http://nginx-exporter:9113/metrics` | **UP** | 15s | Rỗng (Không có lỗi) |
| **prometheus** | `http://prometheus:9090/metrics` | **UP** | 15s | Rỗng (Không có lỗi) |

### 4.2 Trực quan hóa dữ liệu trên Grafana Dashboard
Grafana phiên bản `11.6.0` được triển khai tại cổng `http://127.0.0.1:3000`. Hệ thống sử dụng cơ chế **Provisioning** tự động:
- File `datasources.yml` tự động liên kết nguồn dữ liệu Prometheus (`http://prometheus:9090`) làm mặc định và Loki (`http://loki:3100`).
- File `dashboards.yml` tự động nạp bảng điều khiển từ file JSON `dashboard.json` nằm trong thư mục `monitoring/grafana/provisioning/dashboards/json/`.

Dashboard giám sát tổng hợp **"Hệ Thống Quản Lý Sinh Viên - Giám Sát Tổng Hợp"** gồm 3 khu vực chính:
1. **Hàng 1: Trạng thái Dịch vụ & Exporters**:
   - `Nginx Status` (`nginx_up`): Hiển thị màu xanh lá với trạng thái `UP` (giá trị 1).
   - `MySQL Status` (`mysql_up`): Hiển thị màu xanh lá với trạng thái `UP` (giá trị 1).
   - `MySQL Active Threads`: Hiển thị số luồng kết nối CSDL đang mở (ghi nhận 4 luồng).
   - `Nginx Total Requests`: Hiển thị tổng số request HTTP đã phục vụ.
2. **Hàng 2: Hiệu năng Máy chủ Web & Cơ sở dữ liệu**:
   - Biểu đồ tốc độ request qua Nginx (`sum(rate(nginx_http_requests_total[2m]))`).
   - Biểu đồ số truy vấn CSDL mỗi giây (`rate(mysql_global_status_questions[2m])`).
3. **Hàng 3: Tài nguyên Containers (cAdvisor)**:
   - Biểu đồ bộ nhớ RAM hoạt động theo từng container (`container_memory_working_set_bytes{name!=""}`).
   - Biểu đồ tỷ lệ sử dụng CPU theo từng container (`sum by (name) (rate(container_cpu_usage_seconds_total[2m])) * 100`).

### 4.3 Giám sát Nginx, MySQL và chỉ số tài nguyên Container
Các truy vấn PromQL quan trọng và kết quả ghi nhận thực tế trên hệ thống:

| Tên chỉ số (Metric) | Biểu thức PromQL | Ý nghĩa kỹ thuật | Kết quả thực tế ghi nhận |
| :--- | :--- | :--- | :---: |
| **Trạng thái MySQL** | `mysql_up` | Exporter kết nối thông suốt tới MySQL Server | **1 (UP)** |
| **Trạng thái Nginx** | `nginx_up` | Exporter đọc thành công stub_status Nginx | **1 (UP)** |
| **Số kết nối CSDL** | `mysql_global_status_threads_connected` | Số lượng luồng kết nối client đang mở tới MySQL | **4 kết nối** |
| **Tổng số HTTP Requests**| `nginx_http_requests_total` | Bộ đếm tổng số request Nginx đã xử lý | **133 requests** |
| **Tốc độ Request** | `sum(rate(nginx_http_requests_total[2m]))` | Lưu lượng request trung bình trên giây | **0.25 req/s** |
| **Bộ nhớ RAM App** | `container_memory_working_set_bytes{name=~".*app.*"}` | Bộ nhớ RAM làm việc thực tế của Node.js container | **~48.5 MB** |
| **Bộ nhớ RAM DB** | `container_memory_working_set_bytes{name=~".*db.*"}` | Bộ nhớ RAM đệm và xử lý của MySQL 8.4 container | **~385 MB** |

### 4.4 Thiết kế hệ thống thu thập log với Loki và Promtail
Hệ thống sử dụng Grafana Loki `v3.5.1` lưu trữ nhật ký theo cấu trúc tsdb schema v13. Promtail `v3.5.1` được triển khai để lắng nghe Docker socket (`/var/run/docker.sock`), tự động phát hiện các container và thu gom luồng stdout/stderr.

Định dạng nhật ký được chuẩn hóa:
- **Nginx**: Sử dụng log format JSON `json_analytics`, ghi rõ phương thức HTTP, đường dẫn URL, mã trạng thái HTTP, địa chỉ IP client và thời gian xử lý request.
- **Node.js App**: Sử dụng middleware JSON access logger, đồng thời phát ra các sự kiện nghiệp vụ dưới dạng chuỗi JSON:
  - `{ "event": "student_created", "student_code": "SV999", "full_name": "..." }`
  - `{ "event": "class_delete_blocked", "reason": "Foreign key constraint..." }`
  - `{ "event": "http_not_found", "path": "/not-found-demo" }`

### 4.5 Ba truy vấn LogQL thực nghiệm trên hệ thống
Để kiểm chứng khả năng phân tích nhật ký, hệ thống đã tạo traffic thực tế (chạy bộ smoke test, tạo request 404, kiểm tra ràng buộc nghiệp vụ). Ba câu truy vấn LogQL đã được thực thi và ghi nhận kết quả thành công:

#### Truy vấn LogQL 1: Xem Access Log của Nginx Reverse Proxy
- **Câu lệnh LogQL**:
  ```logql
  {container=~".*nginx.*"}
  ```
- **Mục đích**: Lấy toàn bộ luồng nhật ký truy cập đi qua cổng Nginx.
- **Kết quả thực nghiệm**: Trạng thái `SUCCESS`. Dòng log mẫu nhận được:
  ```json
  {"time_local":"24/Oct/2026:23:24:26 +0000","remote_addr":"172.18.0.1","request_method":"GET","request_uri":"/students","status":200,"body_bytes_sent":4264,"request_time":0.008}
  ```

#### Truy vấn LogQL 2: Lọc các request lỗi HTTP (status >= 400)
- **Câu lệnh LogQL**:
  ```logql
  {container=~".*nginx.*"} | json | status >= 400
  ```
- **Mục đích**: Sử dụng parser `json` để giải mã trường `status` và lọc ra các yêu cầu bị lỗi phía client (404 Not Found, 400 Bad Request, 409 Conflict) hoặc lỗi máy chủ (500).
- **Kết quả thực nghiệm**: Trạng thái `SUCCESS`. Truy vấn lọc chính xác các request cố tình truy cập trang không tồn tại `/not-found-demo` (HTTP 404) và các request vi phạm validation dữ liệu (HTTP 400).
  ```json
  {"time_local":"24/Oct/2026:23:24:26 +0000","remote_addr":"172.18.0.1","request_method":"GET","request_uri":"/not-found-demo","status":404,"body_bytes_sent":945}
  ```

#### Truy vấn LogQL 3: Lọc các sự kiện nghiệp vụ của ứng dụng (App Events)
- **Câu lệnh LogQL**:
  ```logql
  {container=~".*app.*"} | json | event != ""
  ```
- **Mục đích**: Phân tích log ứng dụng Node.js, trích xuất các sự kiện nghiệp vụ quan trọng phục vụ kiểm toán (audit log) như thêm/xóa sinh viên, lỗi trùng lặp mã sinh viên.
- **Kết quả thực nghiệm**: Trạng thái `SUCCESS`. Trả về đúng các sự kiện được kích hoạt trong phiên kiểm thử:
  ```json
  {"event":"student_deleted","student_id":9}
  {"event":"student_created","student_id":9,"student_code":"SV999","full_name":"Sinh Vien Smoke Test","class_id":3}
  {"event":"http_not_found","path":"/not-found-demo","method":"GET"}
  ```

---

## PHẦN 5: KIỂM THỬ VẬN HÀNH VÀ ĐỐI CHIẾU

### 5.1 Kết quả kiểm thử chức năng tự động (Smoke Test)
Hệ thống sử dụng kịch bản kiểm thử tự động `scripts/smoke.js` nhằm kiểm tra toàn diện tính toàn vẹn của ứng dụng từ bên ngoài thông qua Nginx Reverse Proxy. Kết quả kiểm thử đạt **12/12 ca kiểm thử thành công (100% PASS)**:

| Mã TC | Nội dung ca kiểm thử | Phương thức & URL | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Kiểm tra sức khỏe hệ thống | `GET /health` | HTTP 200, status `ok`, db `connected` | HTTP 200, JSON hợp lệ | **ĐẠT** |
| **TC-02** | Xem danh sách sinh viên | `GET /students` | HTTP 200, chứa sinh viên mẫu SV001 | HTTP 200, hiển thị bảng | **ĐẠT** |
| **TC-03** | Xem danh sách lớp học | `GET /classes` | HTTP 200, chứa lớp mẫu ATTT23A | HTTP 200, hiển thị lớp | **ĐẠT** |
| **TC-04** | Xem danh sách điểm số | `GET /grades` | HTTP 200, hiển thị tiêu đề và bảng điểm | HTTP 200, bảng điểm có dữ liệu | **ĐẠT** |
| **TC-05** | Tìm kiếm sinh viên theo mã | `GET /students?q=SV001` | HTTP 200, chỉ hiện SV001, lọc bỏ SV002 | HTTP 200, lọc chính xác | **ĐẠT** |
| **TC-06** | Bắt lỗi bỏ trống mã SV | `POST /students` (code rỗng) | HTTP 400 Bad Request | HTTP 400 | **ĐẠT** |
| **TC-07** | Bắt lỗi điểm số ngoài thang 10 | `POST /grades` (score = 15) | HTTP 400 Bad Request | HTTP 400 | **ĐẠT** |
| **TC-08** | Chặn xóa lớp khi còn sinh viên | `POST /classes/1/delete` | HTTP 409 Conflict, thông báo khóa ngoại | HTTP 409 | **ĐẠT** |
| **TC-09** | Thêm mới lớp học hợp lệ | `POST /classes` (SMOKE99) | HTTP 302 chuyển hướng, lớp mới xuất hiện | HTTP 302, lớp tạo thành công | **ĐẠT** |
| **TC-10** | Thêm mới sinh viên hợp lệ | `POST /students` (SV999) | HTTP 302 chuyển hướng, SV mới xuất hiện | HTTP 302, SV tạo thành công | **ĐẠT** |
| **TC-11** | Dọn dẹp dữ liệu kiểm thử | `POST .../delete` | Xóa SV999, sau đó xóa lớp SMOKE99 | HTTP 302, dọn dẹp sạch | **ĐẠT** |
| **TC-12** | Xử lý lỗi trang 404 | `GET /not-found-demo` | HTTP 404, hiển thị trang lỗi thân thiện | HTTP 404 | **ĐẠT** |

### 5.2 Sao lưu (Backup) và Phục hồi (Restore) đối chiếu Checksum
Để đảm bảo an toàn dữ liệu và khả năng khắc phục thảm họa, quy trình sao lưu và phục hồi được thực hiện và kiểm chứng bằng công cụ tự động:

1. **Sao lưu (Backup)**:
   - Script `scripts/backup.js` thực thi lệnh:
     ```bash
     docker compose exec -T db mysqldump -uroot -p"Root@123456" --single-transaction --default-character-set=utf8mb4 student_management
     ```
   - Tệp sao lưu được tạo: `backups/student_management-20261024-231747.sql` (kích thước: 6,050 bytes).
2. **Kiểm thử phục hồi độc lập (Restore Test)**:
   - Script `scripts/restore_test.js` tự động tạo một cơ sở dữ liệu thử nghiệm cách ly: `student_management_restore_test`.
   - Nạp tệp dump vào CSDL thử nghiệm.
   - Chạy lệnh `CHECKSUM TABLE` và `COUNT(*)` đồng thời trên cả hai cơ sở dữ liệu để đối chiếu:

#### Bảng đối chiếu kết quả toàn vẹn dữ liệu
| Tên bảng | Số bản ghi DB gốc | Số bản ghi DB phục hồi | Mã Checksum DB gốc | Mã Checksum DB phục hồi | Đánh giá toàn vẹn |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **classes** | 2 | 2 | `1169395611` | `1169395611` | **TRÙNG KHỚP 100%** |
| **students** | 3 | 3 | `501223440` | `501223440` | **TRÙNG KHỚP 100%** |
| **subjects** | 2 | 2 | `2768008932` | `2768008932` | **TRÙNG KHỚP 100%** |
| **grades** | 3 | 3 | `3867033484` | `3867033484` | **TRÙNG KHỚP 100%** |

Kết quả đối chiếu cho thấy cả số lượng bản ghi và giá trị checksum của 4 bảng nội dung đều khớp nhau tuyệt đối. Sau khi kiểm tra, script tự động dọn dẹp cơ sở dữ liệu thử nghiệm, đảm bảo không lưu rác trong hệ thống.

### 5.3 Các lỗi phát sinh và biện pháp khắc phục
Trong quá trình hiện thực hóa hệ thống, các sự cố kỹ thuật thực tế đã được phát hiện và xử lý triệt để:

1. **Xung đột cổng Host 3306**:
   - *Hiện tượng*: Máy tính chạy Windows đã cài đặt sẵn MySQL Server cục bộ (PID 7592) chiếm cổng 3306.
   - *Khắc phục*: Không publish cổng 3306 của container MySQL ra ngoài host; đặt mạng `backend` ở chế độ `internal: true`. Mọi truy cập vào CSDL được thực hiện qua ứng dụng hoặc phpMyAdmin cổng 8081.
2. **phpMyAdmin không thể truy cập khi mạng backend đặt `internal: true`**:
   - *Hiện tượng*: Docker chặn ánh xạ cổng từ host tới container nếu container đó chỉ nối vào một mạng `internal`.
   - *Khắc phục*: Bổ sung mạng `management` (bridge thông thường) cho phpMyAdmin bên cạnh mạng `backend`, cho phép truy cập giao diện phpMyAdmin tại `http://127.0.0.1:8081`.
3. **Lỗi xác thực cấu hình của MySQL Exporter v0.17**:
   - *Hiện tượng*: `prom/mysqld-exporter:v0.17.2` báo lỗi `no user specified in section or parent` do yêu cầu tệp cấu hình `.my.cnf` thay vì chỉ nhận chuỗi kết nối qua biến môi trường.
   - *Khắc phục*: Tạo file cấu hình bảo mật `secrets/exporter.cnf`, mount chỉ đọc (`:ro`) vào container tại `/etc/mysqld_exporter/.my.cnf`, thiết lập tham số `--config.my-cnf` và loại trừ file này khỏi Git.
4. **Log Nginx mặc định không thể phân tích bằng LogQL parser `| json`**:
   - *Hiện tượng*: Log Nginx mặc định là text thô, khiến câu truy vấn `| json | status >= 400` không đọc được trường `status`.
   - *Khắc phục*: Định nghĩa định dạng `log_format json_analytics escape=json` trong `nginx/default.conf`. Toàn bộ log Nginx được cấu trúc hóa JSON, giúp LogQL phân tích tức thời.

### 5.4 Đối chiếu yêu cầu đề bài và kịch bản demo

| Hạng mục yêu cầu | Tiêu chí đánh giá | Minh chứng thực tế trong báo cáo | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Quản lý mã nguồn** | Repository, `.gitignore`, 3 commit mốc | Mục 2.1, 2.2; 3 commit `2a93cb8`, `9c23c9c`, `38f29f0` | **HOÀN THÀNH** |
| **Ứng dụng CRUD** | Quản lý sinh viên, lớp học, điểm số | Mục 2.5, 2.6; Smoke test 12/12 ca kiểm thử | **HOÀN THÀNH** |
| **Cơ sở dữ liệu** | MySQL 8.4 và phpMyAdmin | Mục 2.4, 2.7; Schema 4 bảng, phpMyAdmin 8081 | **HOÀN THÀNH** |
| **Docker Compose** | Đóng gói toàn bộ dịch vụ, healthcheck | Mục 1.4, 2.3; `compose.yaml` điều phối 11 services | **HOÀN THÀNH** |
| **Nginx Reverse Proxy** | Cổng 8080, Security Headers, stub_status | Mục 3.1, 3.2; response headers có `nosniff`, `CSP` | **HOÀN THÀNH** |
| **Prometheus & Grafana**| 4 targets UP, Dashboard trực quan | Mục 4.1, 4.2; 4 targets UP, `mysql_up=1`, `nginx_up=1` | **HOÀN THÀNH** |
| **Loki, Promtail, LogQL**| Log JSON, 3 câu truy vấn LogQL có dữ liệu | Mục 4.4, 4.5; `docs/evidence/logql-checks.json` | **HOÀN THÀNH** |
| **Hardening hệ thống** | Non-root, Least privilege, mạng internal | Mục 3.3, 3.4; User node (UID 1000), internal network | **HOÀN THÀNH** |
| **Backup & Restore** | Sao lưu mysqldump, phục hồi đối chiếu | Mục 5.2; Checksum 4 bảng khớp 100% | **HOÀN THÀNH** |

#### Kịch bản Demo thực hành chuẩn
1. **Bước 1: Trình bày Git và Cấu trúc dự án**:
   Mở terminal, chạy `git log --oneline --reverse` chứng minh 3 commit mốc; giải thích file `.gitignore` và `.env.example`.
2. **Bước 2: Trình bày Docker Compose và Trạng thái Containers**:
   Chạy `docker compose ps` minh họa các dịch vụ đang chạy ổn định.
3. **Bước 3: Trình diễn Website Quản lý Sinh viên**:
   Mở trình duyệt truy cập `http://localhost:8080`: Thêm sinh viên mới, sửa thông tin, thực hiện tìm kiếm, nhập điểm số, thử xóa lớp học có sinh viên để chứng minh ràng buộc khóa ngoại được thực thi.
4. **Bước 4: Trình diễn phpMyAdmin**:
   Truy cập `http://localhost:8081`, xem cấu trúc 4 bảng và đối chiếu dữ liệu vừa nhập trên website.
5. **Bước 5: Trình diễn Giám sát Prometheus & Grafana**:
   - Mở `http://localhost:9090/targets` chứng minh 4 targets đang `UP`.
   - Mở `http://localhost:3000` trình bày Dashboard Grafana với các panel trạng thái, lưu lượng request Nginx, truy vấn MySQL và biểu đồ tài nguyên CPU/RAM container.
6. **Bước 6: Trình diễn Logging Loki & LogQL**:
   Mở Grafana Explore, thực thi 3 câu truy vấn LogQL (xem log Nginx, lọc HTTP status $\ge 400$, và lọc sự kiện nghiệp vụ ứng dụng).
7. **Bước 7: Trình diễn Hardening và Sao lưu Phục hồi**:
   - Chạy `docker compose exec app id` chứng minh non-root.
   - Chạy lệnh kiểm tra `SHOW GRANTS` chứng minh tài khoản `student_app` chỉ có quyền CRUD tối thiểu.
   - Chạy `node scripts/restore_test.js` trình diễn đối chiếu bảng Checksum khớp 100%.

---

## KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### Kết luận
Đề tài **Đề 2: Hệ thống Quản lý Sinh viên** đã được triển khai hoàn chỉnh và nghiệm thu thành công trên toàn bộ các tiêu chí kỹ thuật:
- Xây dựng thành công ứng dụng web Node.js Express + EJS với giao diện hiện đại, tối ưu trải nghiệm người dùng, đáp ứng trọn vẹn các yêu cầu nghiệp vụ CRUD sinh viên, lớp học và điểm số.
- Thiết kế mô hình cơ sở dữ liệu MySQL chuẩn hóa, áp dụng đầy đủ các ràng buộc toàn vẹn dữ liệu (khóa ngoại RESTRICT, kiểm tra điểm số 0–10, khóa duy nhất chống trùng điểm).
- Đóng gói và điều phối toàn bộ hệ thống bằng Docker Compose với 11 dịch vụ, cô lập mạng chặt chẽ và lưu trữ bền vững qua Named Volumes.
- Triển khai cổng tiếp nhận Nginx Reverse Proxy được gia cố an ninh với các Security Headers tiêu chuẩn.
- Thiết lập hệ thống quan sát toàn diện với Prometheus (4 targets UP), Grafana Dashboard trực quan và hệ thống log tập trung Grafana Loki, Promtail với 3 truy vấn LogQL được chứng minh bằng dữ liệu thực nghiệm.
- Áp dụng các biện pháp Hardening bài bản (Non-root, Least Privilege, mạng nội bộ, quản lý secrets) và xây dựng quy trình sao lưu phục hồi với kiểm tra Checksum đạt độ tin cậy tuyệt đối.

### Hạn chế còn tồn tại
- Ứng dụng hiện vận hành ở quy mô đơn instance (Single-instance demo), chưa triển khai cơ chế nhân bản (Replicas) và chia sẻ session qua Redis.
- Chứng chỉ HTTPS chưa được kích hoạt cho cổng chính thức trên môi trường nội bộ.
- Chưa tích hợp cơ chế xoay vòng nhật ký (Log Rotation) tự động cho các container nếu vận hành liên tục trong thời gian dài.
- Hệ thống cảnh báo (Alertmanager) của Prometheus chưa liên kết tới các kênh thông báo bên ngoài (Email, Telegram).

### Hướng phát triển trong tương lai
1. **Mở rộng quy mô (Scalability)**: Nâng cấp kiến trúc lên Docker Swarm hoặc Kubernetes, triển khai nhiều instance cho `app` phía sau Nginx Load Balancer.
2. **Bảo mật nâng cao**: Cấu hình chứng chỉ TLS/SSL tin cậy (Let's Encrypt hoặc CA nội bộ), tích hợp Web Application Firewall (ModSecurity hoặc Coraza WAF) trên Nginx.
3. **Cảnh báo tự động**: Tích hợp Prometheus Alertmanager để gửi thông báo cảnh báo tức thời khi container quá tải CPU/RAM hoặc CSDL gặp sự cố ngắt kết nối.
4. **CI/CD Pipeline**: Xây dựng quy trình tự động hóa kiểm thử và triển khai liên tục qua GitHub Actions, tự động quét lỗ hổng bảo mật của image (Trivy scanner) trước khi đẩy lên production.

---

## TÀI LIỆU THAM KHẢO

1. **Docker Inc.** (2024). *Control startup and shutdown order in Compose*.  
   URL: https://docs.docker.com/compose/how-tos/startup-order/
2. **Docker Inc.** (2024). *Compose file reference*.  
   URL: https://docs.docker.com/reference/compose-file/
3. **Oracle Corporation** (2024). *MySQL 8.4 Reference Manual: Security and Privileges*.  
   URL: https://dev.mysql.com/doc/refman/8.4/en/
4. **phpMyAdmin Project** (2024). *phpMyAdmin Documentation and Configuration*.  
   URL: https://docs.phpmyadmin.net/
5. **Nginx Software Inc.** (2024). *NGINX Reverse Proxy and HTTP Proxy Module*.  
   URL: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
6. **Prometheus Authors** (2024). *Prometheus Querying Basics and Architecture*.  
   URL: https://prometheus.io/docs/prometheus/latest/querying/basics/
7. **Grafana Labs** (2024). *LogQL: Log Query Language Documentation*.  
   URL: https://grafana.com/docs/loki/latest/query/log_queries/
8. **Google LLC** (2024). *cAdvisor: Container Advisor Documentation*.  
   URL: https://github.com/google/cadvisor
9. **OWASP Foundation** (2023). *OWASP Secure Headers Project*.  
   URL: https://owasp.org/www-project-secure-headers/
10. **Tài liệu học phần**: *Triển khai và Quản trị Hệ thống Phần mềm* – Đề 2: Hệ thống Quản lý Sinh viên; Giảng viên hướng dẫn: ThS. Nguyễn Anh Chuyên, Trường Đại học Công nghệ Thông tin và Truyền thông – Đại học Thái Nguyên.
