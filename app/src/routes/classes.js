const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        const [classes] = await pool.query(
            `SELECT c.id, c.class_code, c.class_name,
                    COUNT(s.id) AS student_count
             FROM classes c
             LEFT JOIN students s ON s.class_id = c.id
             GROUP BY c.id, c.class_code, c.class_name
             ORDER BY c.class_code`
        );

        res.render("classes", { classes, activePage: "classes" });
    } catch (err) {
        next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const code = String(req.body.class_code || "").trim();
        const name = String(req.body.class_name || "").trim();

        if (!code || !name || code.length > 30 || name.length > 120) {
            return res.status(400).send("Mã lớp và tên lớp không hợp lệ.");
        }

        const [result] = await pool.execute(
            "INSERT INTO classes (class_code, class_name) VALUES (?, ?)",
            [code, name]
        );

        console.log(JSON.stringify({
            event: "class_created",
            class_id: result.insertId,
            class_code: code,
            class_name: name
        }));

        res.redirect("/classes");
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).send("Mã lớp đã tồn tại.");
        }
        next(err);
    }
});

router.post("/:id/edit", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const code = String(req.body.class_code || "").trim();
        const name = String(req.body.class_name || "").trim();

        if (!Number.isInteger(id) || id < 1 ||
            !code || !name || code.length > 30 || name.length > 120) {
            return res.status(400).send("Dữ liệu lớp học không hợp lệ.");
        }

        const [result] = await pool.execute(
            "UPDATE classes SET class_code = ?, class_name = ? WHERE id = ?",
            [code, name, id]
        );

        if (!result.affectedRows) return res.sendStatus(404);

        console.log(JSON.stringify({
            event: "class_updated",
            class_id: id,
            class_code: code,
            class_name: name
        }));

        res.redirect("/classes");
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).send("Mã lớp đã tồn tại.");
        }
        next(err);
    }
});

router.post("/:id/delete", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.sendStatus(400);

        const [result] = await pool.execute(
            "DELETE FROM classes WHERE id = ?",
            [id]
        );

        if (!result.affectedRows) return res.sendStatus(404);

        console.log(JSON.stringify({
            event: "class_deleted",
            class_id: id
        }));

        res.redirect("/classes");
    } catch (err) {
        if (err.code === "ER_ROW_IS_REFERENCED_2") {
            console.log(JSON.stringify({
                event: "class_delete_blocked",
                class_id: req.params.id,
                reason: "Foreign key constraint - students still enrolled"
            }));
            return res.status(409).send(
                "Không thể xóa lớp vì vẫn còn sinh viên thuộc lớp."
            );
        }
        next(err);
    }
});

module.exports = router;
