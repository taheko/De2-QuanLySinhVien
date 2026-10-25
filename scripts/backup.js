const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Parse .env manually without external dependencies
function loadEnv() {
    const envPath = path.join(__dirname, "../.env");
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, "utf8");
    const env = {};
    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const idx = trimmed.indexOf("=");
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim();
            env[key] = val;
        }
    }
    return env;
}

const env = loadEnv();
const ROOT_PASSWORD = env.MYSQL_ROOT_PASSWORD;
const DATABASE = env.MYSQL_DATABASE || "student_management";

if (!ROOT_PASSWORD) {
    console.error("[ERROR] MYSQL_ROOT_PASSWORD not found in .env");
    process.exit(1);
}

const backupsDir = path.join(__dirname, "../backups");
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
const filename = `${DATABASE}-${timestamp}.sql`;
const filepath = path.join(backupsDir, filename);

console.log("\n==========================================================");
console.log(`  SAO LƯU CƠ SỞ DỮ LIỆU MYSQL: ${DATABASE}`);
console.log("==========================================================");
console.log(`Đang chạy mysqldump trên container 'db' -> backups/${filename} ...`);

try {
    const dumpCmd = `docker compose exec -T db mysqldump -uroot -p"${ROOT_PASSWORD}" --single-transaction --default-character-set=utf8mb4 ${DATABASE}`;
    const output = execSync(dumpCmd, { maxBuffer: 10 * 1024 * 1024 });
    fs.writeFileSync(filepath, output);

    const stats = fs.statSync(filepath);
    console.log(`\n[THÀNH CÔNG] File backup đã được tạo:`);
    console.log(`  Đường dẫn: backups/${filename}`);
    console.log(`  Dung lượng: ${stats.size} bytes`);

    // Verify row counts
    const countSql = `SELECT 'classes' AS tbl, COUNT(*) AS count FROM ${DATABASE}.classes UNION ALL SELECT 'students', COUNT(*) FROM ${DATABASE}.students UNION ALL SELECT 'subjects', COUNT(*) FROM ${DATABASE}.subjects UNION ALL SELECT 'grades', COUNT(*) FROM ${DATABASE}.grades;`;
    const countCmd = `docker compose exec -T db mysql -uroot -p"${ROOT_PASSWORD}" -e "${countSql}"`;
    const countResult = execSync(countCmd, { encoding: "utf8" });

    console.log(`\nThống kê số lượng bản ghi tại thời điểm sao lưu:`);
    console.log(countResult);
} catch (err) {
    console.error("[ERROR] Lỗi sao lưu CSDL:", err.message);
    process.exit(1);
}
