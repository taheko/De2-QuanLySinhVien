const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

async function fetchJson(url) {
    const res = await fetch(url);
    return await res.json();
}

async function collect() {
    console.log("Thu thập số liệu kiểm chứng hệ thống thực tế...");
    const evidenceDir = path.join(__dirname, "../docs/evidence");
    if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

    // 1. Prometheus targets
    const targets = await fetchJson("http://localhost:9090/api/v1/targets");

    // 2. Metrics snapshots
    const mysqlUp = await fetchJson("http://localhost:9090/api/v1/query?query=mysql_up");
    const nginxUp = await fetchJson("http://localhost:9090/api/v1/query?query=nginx_up");
    const threadsConnected = await fetchJson("http://localhost:9090/api/v1/query?query=mysql_global_status_threads_connected");
    const nginxRequests = await fetchJson("http://localhost:9090/api/v1/query?query=nginx_http_requests_total");

    // 3. Container user inspect
    const appId = execSync("docker compose exec app id", { encoding: "utf8" }).trim();

    // 4. Network inspect
    const backendNet = execSync("docker network inspect de2_quanlysinhvien_backend", { encoding: "utf8" });
    const netJson = JSON.parse(backendNet);

    // 5. Database grants
    const grants = execSync("docker compose exec -T db mysql -uroot -pRoot@123456 -e \"SHOW GRANTS FOR 'student_app'@'%';\"", { encoding: "utf8" }).trim();

    const snapshot = {
        collected_at: new Date().toISOString(),
        targets: targets.data?.activeTargets?.map(t => ({
            job: t.labels.job,
            instance: t.labels.instance,
            health: t.health,
            lastScrape: t.lastScrape
        })),
        metrics: {
            mysql_up: mysqlUp.data?.result?.[0]?.value?.[1],
            nginx_up: nginxUp.data?.result?.[0]?.value?.[1],
            threads_connected: threadsConnected.data?.result?.[0]?.value?.[1],
            nginx_requests_total: nginxRequests.data?.result?.[0]?.value?.[1]
        },
        hardening: {
            app_id: appId,
            backend_network_internal: netJson[0]?.Internal,
            student_app_grants: grants.split("\n").filter(l => !l.includes("Warning"))
        }
    };

    fs.writeFileSync(path.join(evidenceDir, "runtime-checks.json"), JSON.stringify(snapshot, null, 2));
    console.log("[THÀNH CÔNG] Đã lưu snapshot số liệu thực tế vào docs/evidence/runtime-checks.json");
    console.log(JSON.stringify(snapshot, null, 2));
}

collect().catch(console.error);
