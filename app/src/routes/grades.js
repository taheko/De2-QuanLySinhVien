const express = require("express");
const pool = require("../db");

const router = express.Router();

function validGrade(body) {
    const studentId = Number(body.student_id);
    const subjectId = Number(body.subject_id);
    const score = Number(body.score);
    const semester = String(body.semester || "").trim();

    if (!Number.isInteger(studentId) || studentId < 1 ||
        !Number.isInteger(subjectId) || subjectId < 1) {
        return "Hãy chọn sinh viên và môn học hợp lệ.";
    }

    if (body.score === "" || !Number.isFinite(score) || score < 0 || score > 10) {
        return "Điểm phải nằm trong khoảng từ 0 đến 10.";
    }

    if (!semester || semester.length > 30) {
        return "Học kỳ không hợp lệ.";
    }

    return null;
}

router.get("/", async (req, res, next) => {
    try {
        const [[students], [subjects], [grades]] = await Promise.all([
            pool.query("SELECT id, student_code, full_name FROM students ORDER BY student_code"),
            pool.query("SELECT id, subject_code, subject_name FROM subjects ORDER BY subject_code"),
            pool.query(
                `SELECT g.id, g.score, g.semester, s.student_code, s.full_name,
                        sub.subject_code, sub.subject_name
                 FROM grades g
                 JOIN students s ON s.id = g.student_id
                 JOIN subjects sub ON sub.id = g.subject_id
                 ORDER BY g.id DESC`
            )
        ]);

        res.render("grades", { students, subjects, grades, activePage: "grades" });
    } catch (err) {
        next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const error = validGrade(req.body);
        if (error) {
            console.log(JSON.stringify({ event: "validation_failed", error, entity: "grade", body: req.body }));
            return res.status(400).send(error);
        }

        const [result] = await pool.execute(
            `INSERT INTO grades (student_id, subject_id, score, semester)
             VALUES (?, ?, ?, ?)`,
            [
                Number(req.body.student_id),
                Number(req.body.subject_id),
                Number(req.body.score),
                String(req.body.semester).trim()
            ]
        );

        console.log(JSON.stringify({
            event: "grade_created",
            grade_id: result.insertId,
            student_id: Number(req.body.student_id),
            subject_id: Number(req.body.subject_id),
            score: Number(req.body.score),
            semester: String(req.body.semester).trim()
        }));

        res.redirect("/grades");
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            console.log(JSON.stringify({ event: "duplicate_error", error: "ER_DUP_ENTRY", entity: "grade" }));
            return res.status(409).send("Điểm cho môn học và học kỳ này đã tồn tại.");
        }
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(400).send("Sinh viên hoặc môn học không tồn tại.");
        }
        next(err);
    }
});

router.post("/:id/edit", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const score = Number(req.body.score);
        const semester = String(req.body.semester || "").trim();

        if (!Number.isInteger(id) || id < 1 ||
            req.body.score === "" || !Number.isFinite(score) ||
            score < 0 || score > 10 || !semester || semester.length > 30) {
            return res.status(400).send("Điểm hoặc học kỳ không hợp lệ.");
        }

        const [result] = await pool.execute(
            "UPDATE grades SET score = ?, semester = ? WHERE id = ?",
            [score, semester, id]
        );

        if (!result.affectedRows) return res.sendStatus(404);

        console.log(JSON.stringify({
            event: "grade_updated",
            grade_id: id,
            score,
            semester
        }));

        res.redirect("/grades");
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).send("Bản ghi điểm này đã tồn tại.");
        }
        next(err);
    }
});

router.post("/:id/delete", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.sendStatus(400);

        const [result] = await pool.execute(
            "DELETE FROM grades WHERE id = ?",
            [id]
        );

        if (!result.affectedRows) return res.sendStatus(404);

        console.log(JSON.stringify({
            event: "grade_deleted",
            grade_id: id
        }));

        res.redirect("/grades");
    } catch (err) {
        next(err);
    }
});

module.exports = router;
