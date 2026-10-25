/**
 * Automated Smoke Test & Verification Script for Student Management System (De 2)
 * Tests all CRUD operations, foreign key constraints, input validation, and HTTP endpoints.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...(options.headers || {})
        },
        redirect: "manual" // Handle 302 redirects manually
    });
    const text = await res.text();
    return { status: res.status, headers: res.headers, body: text };
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(`[FAIL] ${message}`);
    }
    console.log(`  [PASS] ${message}`);
}

async function runTests() {
    console.log(`\n======================================================`);
    console.log(`  RUNNING SMOKE TESTS ON ${BASE_URL}`);
    console.log(`======================================================\n`);

    let passed = 0;
    let failed = 0;

    async function testCase(name, fn) {
        process.stdout.write(`* Testing: ${name} ... `);
        try {
            await fn();
            console.log("OK");
            passed++;
        } catch (err) {
            console.log("FAILED");
            console.error(`    Error: ${err.message}`);
            failed++;
        }
    }

    // 1. Health check
    await testCase("Health Check Endpoint (/health)", async () => {
        const res = await request("/health");
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        assert(data.status === "ok", "Expected status ok");
        assert(data.database === "connected", "Expected database connected");
    });

    // 2. View pages
    await testCase("View Students Page (/students)", async () => {
        const res = await request("/students");
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.body.includes("Danh Sách Sinh Viên"), "Page contains student title");
        assert(res.body.includes("SV001"), "Contains seed student SV001");
    });

    await testCase("View Classes Page (/classes)", async () => {
        const res = await request("/classes");
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.body.includes("Quản Lý Lớp Học"), "Page contains class title");
        assert(res.body.includes("ATTT23A"), "Contains seed class ATTT23A");
    });

    await testCase("View Grades Page (/grades)", async () => {
        const res = await request("/grades");
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.body.includes("Quản Lý Điểm Số"), "Page contains grades title");
    });

    // 3. Search functionality
    await testCase("Search Student (/students?q=SV001)", async () => {
        const res = await request("/students?q=SV001");
        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.body.includes("SV001"), "Search returns SV001");
        assert(!res.body.includes("SV002"), "Search filters out SV002");
    });

    // 4. Validation errors
    await testCase("Validation Error on Invalid Student Code", async () => {
        const res = await request("/students", {
            method: "POST",
            body: new URLSearchParams({
                student_code: "",
                full_name: "Test Name",
                class_id: "1"
            }).toString()
        });
        assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
    });

    await testCase("Validation Error on Grade Out of Range (> 10)", async () => {
        const res = await request("/grades", {
            method: "POST",
            body: new URLSearchParams({
                student_id: "1",
                subject_id: "1",
                score: "15.0",
                semester: "2026-1"
            }).toString()
        });
        assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
    });

    // 5. Foreign key constraint test
    await testCase("Prevent Deleting Class When Students Enrolled", async () => {
        // Class 1 (ATTT23A) has students SV001 and SV002
        const res = await request("/classes/1/delete", { method: "POST" });
        assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
        assert(res.body.includes("Không thể xóa lớp"), "Expected foreign key restriction message");
    });

    // 6. Complete CRUD Lifecycle
    let testClassId = null;
    let testStudentId = null;

    await testCase("CRUD: Create New Class", async () => {
        const res = await request("/classes", {
            method: "POST",
            body: new URLSearchParams({
                class_code: "SMOKE99",
                class_name: "Lop Kiem Thu Tu Dong"
            }).toString()
        });
        assert(res.status === 302, `Expected 302 redirect after create, got ${res.status}`);

        const list = await request("/classes");
        assert(list.body.includes("SMOKE99"), "New class found in class list");

        // Extract class ID from form action
        const match = list.body.match(/action="\/classes\/(\d+)\/delete"/);
        if (match) testClassId = match[1];
    });

    await testCase("CRUD: Create New Student", async () => {
        const listClasses = await request("/classes");
        const match = listClasses.body.match(/action="\/classes\/(\d+)\/edit"[\s\S]*?value="SMOKE99"/);
        const classId = match ? match[1] : "1";

        const res = await request("/students", {
            method: "POST",
            body: new URLSearchParams({
                student_code: "SV999",
                full_name: "Sinh Vien Smoke Test",
                date_of_birth: "2005-12-30",
                gender: "Nam",
                email: "smoke999@example.com",
                phone: "0999888777",
                class_id: classId
            }).toString()
        });
        assert(res.status === 302, `Expected 302 redirect after student create, got ${res.status}`);

        const search = await request("/students?q=SV999");
        assert(search.body.includes("SV999"), "New student found in search");

        const idMatch = search.body.match(/action="\/students\/(\d+)\/delete"/);
        if (idMatch) testStudentId = idMatch[1];
    });

    await testCase("CRUD: Clean Up Test Student and Test Class", async () => {
        if (testStudentId) {
            const delStudent = await request(`/students/${testStudentId}/delete`, { method: "POST" });
            assert(delStudent.status === 302, "Student deleted successfully");
        }

        const listClasses = await request("/classes");
        const match = listClasses.body.match(/SMOKE99[\s\S]*?action="\/classes\/(\d+)\/delete"/);
        const classId = match ? match[1] : testClassId;

        if (classId) {
            const delClass = await request(`/classes/${classId}/delete`, { method: "POST" });
            assert(delClass.status === 302, "Class deleted successfully");
        }
    });

    // 7. 404 test
    await testCase("404 Error Handler (/not-found-demo)", async () => {
        const res = await request("/not-found-demo");
        assert(res.status === 404, `Expected 404, got ${res.status}`);
    });

    console.log(`\n------------------------------------------------------`);
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`======================================================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error("Fatal test error:", err);
    process.exit(1);
});
