const fs = require("fs");
const path = require("path");

async function queryLoki(query, limit = 10) {
    const url = new URL("http://localhost:3100/loki/api/v1/query_range");
    url.searchParams.set("query", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("start", String((Date.now() - 3600 * 1000) * 1000000)); // last 1 hour in nanoseconds
    url.searchParams.set("end", String(Date.now() * 1000000));

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const json = await res.json();
    return json;
}

async function main() {
    console.log("==========================================================");
    console.log("  KIỂM TRA 3 TRUY VẤN LOGQL VỚI LOKI & PROMTAIL");
    console.log("==========================================================\n");

    const queries = [
        {
            name: "LogQL 1: Xem Access Log Nginx",
            query: '{container=~".*nginx.*"}'
        },
        {
            name: "LogQL 2: Lọc các request lỗi HTTP (status >= 400)",
            query: '{container=~".*nginx.*"} | json | status >= 400'
        },
        {
            name: "LogQL 3: Lọc sự kiện nghiệp vụ ứng dụng (app events)",
            query: '{container=~".*app.*"} | json | event != ""'
        }
    ];

    const results = {};

    for (const q of queries) {
        console.log(`\n* Thực thi [${q.name}]:`);
        console.log(`  Query: ${q.query}`);
        try {
            const data = await queryLoki(q.query, 5);
            const streams = data.data?.result || [];
            let totalEntries = 0;
            streams.forEach(s => totalEntries += s.values.length);
            console.log(`  -> Trạng thái: ${data.status.toUpperCase()}, Tìm thấy ${totalEntries} dòng logs`);

            if (streams.length > 0 && streams[0].values.length > 0) {
                console.log(`  -> Mẫu log thực tế mới nhất:`);
                const sample = streams[0].values[0][1];
                console.log(`     ${sample.slice(0, 160)}...`);
            }
            results[q.name] = { query: q.query, status: data.status, count: totalEntries, sample: streams[0]?.values[0]?.[1] };
        } catch (err) {
            console.error(`  -> Lỗi: ${err.message}`);
            results[q.name] = { query: q.query, error: err.message };
        }
    }

    // Save evidence to docs/evidence/
    const evidenceDir = path.join(__dirname, "../docs/evidence");
    if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });
    fs.writeFileSync(path.join(evidenceDir, "logql-checks.json"), JSON.stringify(results, null, 2));
    console.log(`\n[THÀNH CÔNG] Đã lưu kết quả kiểm chứng LogQL vào docs/evidence/logql-checks.json\n`);
}

main().catch(console.error);
