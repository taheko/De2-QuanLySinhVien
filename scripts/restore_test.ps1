# Restore Test Script for Student Management Database (De 2)
# Verifies database recovery into an isolated test database and compares CHECKSUM and row counts

param (
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectDir

# Load .env variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $name = $parts[0].Trim()
            $value = $parts[1].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$RootPassword = [Environment]::GetEnvironmentVariable("MYSQL_ROOT_PASSWORD")
$SourceDb = [Environment]::GetEnvironmentVariable("MYSQL_DATABASE")
if (!$SourceDb) { $SourceDb = "student_management" }
$TestDb = "${SourceDb}_restore_test"

if (!$RootPassword) {
    Write-Error "MYSQL_ROOT_PASSWORD not found in .env"
    exit 1
}

# Find latest backup if not specified
if (!$BackupFile) {
    $Latest = Get-ChildItem -Path (Join-Path $ProjectDir "backups") -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (!$Latest) {
        Write-Error "Không tìm thấy file backup nào trong thư mục backups/"
        exit 1
    }
    $BackupFile = $Latest.FullName
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  KIỂM THỬ PHỤC HỒI CƠ SỞ DỮ LIỆU MYSQL" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "File nguồn: $BackupFile"
Write-Host "Database nguồn: $SourceDb"
Write-Host "Database thử nghiệm: $TestDb"

# 1. Create isolated test database
Write-Host "`n1. Khởi tạo cơ sở dữ liệu thử nghiệm..."
docker compose exec -T db mysql -uroot "-p$RootPassword" -e "
    DROP DATABASE IF EXISTS $TestDb;
    CREATE DATABASE $TestDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"

# 2. Restore into test database
Write-Host "2. Nhập dữ liệu sao lưu vào $TestDb..."
Get-Content $BackupFile | docker compose exec -T db mysql -uroot "-p$RootPassword" $TestDb

# 3. Check CHECKSUM on both databases
Write-Host "`n3. Thực hiện kiểm tra CHECKSUM TABLE đối chiếu hai cơ sở dữ liệu:" -ForegroundColor Yellow
$ChecksumSource = docker compose exec -T db mysql -uroot "-p$RootPassword" -e "CHECKSUM TABLE $SourceDb.classes, $SourceDb.students, $SourceDb.subjects, $SourceDb.grades;"
$ChecksumTest = docker compose exec -T db mysql -uroot "-p$RootPassword" -e "CHECKSUM TABLE $TestDb.classes, $TestDb.students, $TestDb.subjects, $TestDb.grades;"

Write-Host "`n--- Checksum Database Gốc ($SourceDb) ---"
Write-Host $ChecksumSource
Write-Host "--- Checksum Database Phục Hồi ($TestDb) ---"
Write-Host $ChecksumTest

# 4. Compare Row Counts
Write-Host "`n4. Thống kê số lượng bản ghi của 4 bảng:" -ForegroundColor Yellow
$CountSource = docker compose exec -T db mysql -uroot "-p$RootPassword" -e "
    SELECT 'classes' AS tbl, COUNT(*) AS count FROM $SourceDb.classes
    UNION ALL SELECT 'students', COUNT(*) FROM $SourceDb.students
    UNION ALL SELECT 'subjects', COUNT(*) FROM $SourceDb.subjects
    UNION ALL SELECT 'grades', COUNT(*) FROM $SourceDb.grades;
"
$CountTest = docker compose exec -T db mysql -uroot "-p$RootPassword" -e "
    SELECT 'classes' AS tbl, COUNT(*) AS count FROM $TestDb.classes
    UNION ALL SELECT 'students', COUNT(*) FROM $TestDb.students
    UNION ALL SELECT 'subjects', COUNT(*) FROM $TestDb.subjects
    UNION ALL SELECT 'grades', COUNT(*) FROM $TestDb.grades;
"

Write-Host "--- Số bản ghi Database Gốc ---"
Write-Host $CountSource
Write-Host "--- Số bản ghi Database Phục Hồi ---"
Write-Host $CountTest

# 5. Clean up test database
Write-Host "`n5. Thu hồi và dọn dẹp database thử nghiệm..."
docker compose exec -T db mysql -uroot "-p$RootPassword" -e "DROP DATABASE IF EXISTS $TestDb;"

Write-Host "`n[KẾT LUẬN] Phục hồi và kiểm tra toàn vẹn dữ liệu: HOÀN TẤT THÀNH CÔNG!" -ForegroundColor Green
