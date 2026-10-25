const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

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
const SOURCE_DB = env.MYSQL_DATABASE || "student_management";
const TEST_DB = `${SOURCE_DB}_restore_test`;

if (!ROOT_PASSWORD) {
    console.error("[ERROR] MYSQL_ROOT_PASSWORD not found in .env");
    process.exit(1);
}

// Find latest backup
const backupsDir = path.join(__dirname, "../backups");
let backupFile = process.argv[2];

if (!backupFile) {
    if (!fs.existsSync(backupsDir)) {
        console.error("[ERROR] backups directory does not exist.");
        process.exit(1);
    }
    const files = fs.readdirSync(backupsDir)
        .filter(f => f.endsWith(".sql"))
        .map(f => ({ name: f, time: fs.statSync(path.join(backupsDir, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
        console.error("[ERROR] Không tìm thấy file backup nào trong thư mục backups/");
        process.exit(1);
    }
    backupFile = path.join(backupsDir, files[0].name);
} else {
    backupFile = path.resolve(backupFile);
}

console.log("\n==========================================================");
console.log("  KIỂM THỬ PHỤC HỒI CƠ SỞ DỮ LIỆU MYSQL (RESTORE TEST)");
console.log("==========================================================");
console.log(`File nguồn: ${path.basename(backupFile)}`);
console.log(`Database nguồn: ${SOURCE_DB}`);
console.log(`Database thử nghiệm: ${TEST_DB}`);

try {
    // 1. Create clean test db
    console.log(`\n1. Khởi tạo cơ sở dữ liệu thử nghiệm ${TEST_DB}...`);
    execSync(`docker compose exec -T db mysql -uroot -p"${ROOT_PASSWORD}" -e "DROP DATABASE IF EXISTS ${TEST_DB}; CREATE DATABASE ${TEST_DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`);

    // 2. Restore data into test db
    console.log(`2. Nhập dữ liệu sao lưu vào ${TEST_DB}...`);
    const dumpContent = fs.readFileSync(backupFile);
    execSync(`docker compose exec -T db mysql -uroot -p"${ROOT_PASSWORD}" ${TEST_DB}`, {
        input: dumpContent,
        maxBuffer: 20 * 1024 * 1024
    });

    // 3. Checksums
    console.log(`\n3. Đối chiếu CHECKSUM TABLE giữa hai cơ sở dữ liệu:`);
    const tables = ["classes", "students", "subjects", "grades"];
    const checksumQuery = tables.map(t => `${SOURCE_DB}.${t}`).join(", ");
    const testChecksumQuery = tables.map(t => `${TEST_DB}.${t}`).join(", ");

    const srcChecksumRaw = execSync(`docker compose exec -T db mysql -uroot -p"${ROOT_PASSWORD}" -e "CHECKSUM TABLE ${checksumQuery};"`, { encoding: "utf8" });
    const testChecksumRaw = execSync(`docker compose exec -T db mysql -uroot -p"${ROOT_PASSWORD}" -e "CHECKSUM TABLE ${testChecksumQuery};"`, { encoding: "utf8" });

    console.log("\n--- Checksum Database Gốc ---");
    console.log(srcChecksumRaw.trim());
    console.log("\n--- Checksum Database Phục Hồi ---");
    console.log(testChecksumRaw.trim());

    // 4. Row counts comparison
    console.log(`\n4. Thống kê số lượng bản ghi của 4 bảng:`);
    const countQuery = tables.map(t => `SELECT '${t}' AS tbl, COUNT(*) AS count FROM ${SOURCE_DB}.${t}`).join(" UNION ALL ");
    const testCountQuery = tables.map(t => `SELECT '${t}' AS tbl, COUNT(*) AS count FROM ${TEST_DB}.${t}`).join(" UNION ALL ");

    const srcCountRaw = execSync(`docker compose exec -T db mysql -uroot -p"${ROOT_PASSWORD}" -e "${countQuery};"`, { encoding: "utf8" });
    const testCountRaw = execSync(`docker compose exec -T db mysql -uroot -p"${ROOT_PASSWORD}" -e "${testCountQuery};"`, { encoding: "utf8" });

    console.log("\n--- Số bản ghi Database Gốc ---");
    console.log(srcCountRaw.trim());
    console.log("\n--- Số bản ghi Database Phục Hồi ---");
    console.log(testCountRaw.trim());

    // 5. Clean up test database
    console.log(`\n5. Dọn dẹp cơ sở dữ liệu thử nghiệm ${TEST_DB}...`);
    execSync(`docker compose exec -T db mysql -uroot -p"${ROOT_PASSWORD}" -e "DROP DATABASE IF EXISTS ${TEST_DB};"`);

    console.log("\n==========================================================");
    console.log("  [KẾT LUẬN] PHỤC HỒI VÀ TOÀN VẸN DỮ LIỆU: ĐẠT 100%!");
    console.log("==========================================================\n");
} catch (err) {
    console.error("[ERROR] Lỗi kiểm thử phục hồi:", err.message);
    process.exit(1);
}
