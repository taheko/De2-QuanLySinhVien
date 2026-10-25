# Backup Script for Student Management Database (De 2)
# Uses mysqldump with --single-transaction inside Docker

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
$Database = [Environment]::GetEnvironmentVariable("MYSQL_DATABASE")
if (!$Database) { $Database = "student_management" }

if (!$RootPassword) {
    Write-Error "MYSQL_ROOT_PASSWORD not found in .env"
    exit 1
}

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDir = Join-Path $ProjectDir "backups"
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$OutputFile = Join-Path $BackupDir "$Database-$Timestamp.sql"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SAO LƯU CƠ SỞ DỮ LIỆU MYSQL: $Database" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Thực hiện mysqldump qua container 'db'..."

# Execute mysqldump
docker compose exec -T db mysqldump -uroot "-p$RootPassword" --single-transaction --default-character-set=utf8mb4 $Database > $OutputFile

if ((Test-Path $OutputFile) -and (Get-Item $OutputFile).Length -gt 0) {
    $FileSize = (Get-Item $OutputFile).Length
    Write-Host "`n[THÀNH CÔNG] File backup đã được tạo:" -ForegroundColor Green
    Write-Host "  Đường dẫn: $OutputFile"
    Write-Host "  Kích thước: $FileSize bytes"

    # Query current row counts for verification
    Write-Host "`nThống kê số lượng bản ghi tại thời điểm sao lưu:" -ForegroundColor Yellow
    $Query = "SELECT 'classes' AS tbl, COUNT(*) AS count FROM student_management.classes UNION ALL SELECT 'students', COUNT(*) FROM student_management.students UNION ALL SELECT 'subjects', COUNT(*) FROM student_management.subjects UNION ALL SELECT 'grades', COUNT(*) FROM student_management.grades;"
    $Counts = docker compose exec -T db mysql -uroot "-p$RootPassword" -e "$Query"
    Write-Host $Counts
} else {
    Write-Error "[LỖI] File sao lưu rỗng hoặc không thể tạo."
    exit 1
}
