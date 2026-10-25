const express = require("express");
const pool = require("../db");

const router = express.Router();

function validStudent(body) {
    const code = String(body.student_code || "").trim();
    const name = String(body.full_name || "").trim();
    const classId = Number(body.class_id);
    const gender = String(body.gender || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const dob = String(body.date_of_birth || "").trim();

    if (!code || !name || !Number.isInteger(classId) || classId < 1) {
        return "Mã sinh viên, họ tên và lớp là bắt buộc.";
    }

    if (code.length > 30 || name.length > 150) {
        return "Mã sinh viên hoặc họ tên vượt quá độ dài cho phép.";
    }

    if (gender && !["Nam", "Nu", "Khac"].includes(gender)) {
        return "Giới tính không hợp lệ.";
    }

    if (email.length > 150 || phone.length > 20) {
        return "Email hoặc số điện thoại vượt quá độ dài cho phép.";
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Email không hợp lệ.";
    }

    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        return "Ngày sinh phải có định dạng YYYY-MM-DD.";
    }

    return null;
}

async function getFormData(id = null) {
    const [classes] = await pool.query(
        "SELECT id, class_code, class_name FROM classes ORDER BY class_code"
    );

    let student = {};

    if (id) {
        const [rows] = await pool.execute(
            `SELECT id, student_code, full_name,
                    DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth,
                    gender, email, phone, class_id
             FROM students WHERE id = ?`,
            [id]
        );
        if (!rows.length) return null;
        student = rows[0];
    }

    return { classes, student };
}

router.get("/", async (req, res, next) => {
    try {
        const q = String(req.query.q || "").trim();
        const pattern = `%${q}%`;

        const [students] = await pool.execute(
            `SELECT s.id, s.student_code, s.full_name,
                    DATE_FORMAT(s.date_of_birth, '%Y-%m-%d') AS date_of_birth,
                    s.gender, s.email, s.phone, c.class_name, c.class_code
             FROM students s
             JOIN classes c ON c.id = s.class_id
             WHERE s.student_code LIKE ? OR s.full_name LIKE ?
             ORDER BY s.id DESC`,
            [pattern, pattern]
        );

        res.render("students", { students, q, activePage: "students" });
    } catch (err) {
        next(err);
    }
});

router.get("/new", async (req, res, next) => {
    try {
        const data = await getFormData();

        if (!data.classes.length) {
            return res.status(400).send("Hãy tạo ít nhất một lớp trước.");
        }

        res.render("form", {
            title: "Thêm sinh viên",
            action: "/students",
            backUrl: "/students",
            activePage: "students",
            error: null,
            fields: [
                { name: "student_code", label: "Mã sinh viên", required: true },
                { name: "full_name", label: "Họ tên", required: true },
                { name: "date_of_birth", label: "Ngày sinh", type: "date" },
                {
                    name: "gender", label: "Giới tính", type: "select",
                    options: [
                        { value: "Nam", label: "Nam" },
                        { value: "Nu", label: "Nữ" },
                        { value: "Khac", label: "Khác" }
                    ]
                },
                { name: "email", label: "Email", type: "email" },
                { name: "phone", label: "Số điện thoại" },
                {
                    name: "class_id", label: "Lớp", type: "select", required: true,
                    options: data.classes.map(c => ({
                        value: c.id,
                        label: `${c.class_code} - ${c.class_name}`
                    }))
                }
            ]
        });
    } catch (err) {
        next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const error = validStudent(req.body);
        if (error) {
            console.log(JSON.stringify({ event: "validation_failed", error, entity: "student", body: req.body }));
            return res.status(400).send(error);
        }

        const { student_code, full_name, date_of_birth, gender, email, phone, class_id } = req.body;

        const [result] = await pool.execute(
            `INSERT INTO students
             (student_code, full_name, date_of_birth, gender, email, phone, class_id)
             VALUES (?, ?, NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), NULLIF(?, ''), ?)`,
            [
                student_code.trim(), full_name.trim(),
                date_of_birth || "", gender || "",
                email.trim(), phone.trim(), Number(class_id)
            ]
        );

        console.log(JSON.stringify({
            event: "student_created",
            student_id: result.insertId,
            student_code: student_code.trim(),
            full_name: full_name.trim(),
            class_id: Number(class_id)
        }));

        res.redirect("/students");
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            console.log(JSON.stringify({ event: "duplicate_error", error: "ER_DUP_ENTRY", student_code: req.body.student_code }));
            return res.status(409).send("Mã sinh viên đã tồn tại.");
        }
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).send("Lớp được chọn không tồn tại.");
        }
        next(err);
    }
});

router.get("/:id/edit", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.sendStatus(400);

        const data = await getFormData(id);
        if (!data) return res.sendStatus(404);

        const s = data.student;
        const classOptions = data.classes.map(c => ({
            value: c.id,
            label: `${c.class_code} - ${c.class_name}`
        }));

        res.render("form", {
            title: "Sửa sinh viên",
            action: `/students/${id}/edit`,
            backUrl: "/students",
            activePage: "students",
            error: null,
            fields: [
                { name: "student_code", label: "Mã sinh viên", value: s.student_code, required: true },
                { name: "full_name", label: "Họ tên", value: s.full_name, required: true },
                { name: "date_of_birth", label: "Ngày sinh", type: "date", value: s.date_of_birth || "" },
                {
                    name: "gender", label: "Giới tính", type: "select", value: s.gender,
                    options: [
                        { value: "Nam", label: "Nam" },
                        { value: "Nu", label: "Nữ" },
                        { value: "Khac", label: "Khác" }
                    ]
                },
                { name: "email", label: "Email", type: "email", value: s.email },
                { name: "phone", label: "Số điện thoại", value: s.phone },
                {
                    name: "class_id", label: "Lớp", type: "select",
                    value: s.class_id, required: true, options: classOptions
                }
            ]
        });
    } catch (err) {
        next(err);
    }
});

router.post("/:id/edit", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.sendStatus(400);

        const error = validStudent(req.body);
        if (error) return res.status(400).send(error);

        const [result] = await pool.execute(
            `UPDATE students
             SET student_code = ?, full_name = ?, date_of_birth = NULLIF(?, ''),
                 gender = NULLIF(?, ''), email = NULLIF(?, ''),
                 phone = NULLIF(?, ''), class_id = ?
             WHERE id = ?`,
            [
                req.body.student_code.trim(), req.body.full_name.trim(),
                req.body.date_of_birth || "", req.body.gender || "",
                req.body.email.trim(), req.body.phone.trim(),
                Number(req.body.class_id), id
            ]
        );

        if (!result.affectedRows) return res.sendStatus(404);

        console.log(JSON.stringify({
            event: "student_updated",
            student_id: id,
            student_code: req.body.student_code.trim(),
            full_name: req.body.full_name.trim()
        }));

        res.redirect("/students");
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).send("Mã sinh viên đã tồn tại.");
        }
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).send("Lớp được chọn không tồn tại.");
        }
        next(err);
    }
});

router.post("/:id/delete", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.sendStatus(400);

        const [result] = await pool.execute(
            "DELETE FROM students WHERE id = ?",
            [id]
        );

        if (!result.affectedRows) return res.sendStatus(404);

        console.log(JSON.stringify({
            event: "student_deleted",
            student_id: id
        }));

        res.redirect("/students");
    } catch (err) {
        if (err.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).send(
                "Không thể xóa sinh viên vì vẫn còn bản ghi điểm liên quan."
            );
        }
        next(err);
    }
});

module.exports = router;
