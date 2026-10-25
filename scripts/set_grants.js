const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function loadEnv() {
    const envPath = path.join(__dirname, "../.env");
    const content = fs.readFileSync(envPath, "utf8");
    const env = {};
    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const idx = trimmed.indexOf("=");
            env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
        }
    }
    return env;
}

const env = loadEnv();
const rootPass = env.MYSQL_ROOT_PASSWORD;
const appUser = env.MYSQL_USER || "student_app";
const dbName = env.MYSQL_DATABASE || "student_management";

const sql = `
REVOKE ALL PRIVILEGES, GRANT OPTION FROM '${appUser}'@'%';
GRANT USAGE ON *.* TO '${appUser}'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON \`${dbName}\`.* TO '${appUser}'@'%';
FLUSH PRIVILEGES;
SHOW GRANTS FOR '${appUser}'@'%';
`;

try {
    const res = execSync(`docker compose exec -T db mysql -uroot -p"${rootPass}"`, {
        input: sql,
        encoding: "utf8"
    });
    console.log(res);
} catch (err) {
    console.error(err.message);
}
