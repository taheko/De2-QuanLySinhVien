require("dotenv").config();

const express = require("express");
const path = require("path");
const pool = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Structured JSON HTTP Access Logger for Prometheus/Loki/LogQL
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const logData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            duration_ms: Date.now() - start,
            ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress
        };
        console.log(JSON.stringify(logData));
    });
    next();
});

// Health check endpoint
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.status(200).json({
            status: "ok",
            database: "connected",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(JSON.stringify({
            event: "health_failed",
            error: error.message
        }));
        res.status(503).json({
            status: "error",
            database: "disconnected"
        });
    }
});

app.get("/", (req, res) => {
    res.redirect("/students");
});

app.use("/students", require("./routes/students"));
app.use("/classes", require("./routes/classes"));
app.use("/grades", require("./routes/grades"));

// 404 handler
app.use((req, res) => {
    console.log(JSON.stringify({
        event: "http_not_found",
        path: req.originalUrl,
        method: req.method
    }));
    res.status(404).send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <title>404 - Không tìm thấy trang</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <header>
                <div class="navbar">
                    <a href="/students" class="brand">Hệ Thống Quản Lý Sinh Viên</a>
                </div>
            </header>
            <div class="container" style="text-align: center; margin-top: 60px;">
                <h1 style="font-size: 3rem; color: #ef4444;">404</h1>
                <h2>Không tìm thấy trang yêu cầu</h2>
                <p style="margin: 20px 0; color: #64748b;">Đường dẫn <code>${req.originalUrl}</code> không tồn tại trên hệ thống.</p>
                <a href="/students" class="btn btn-primary">Quay lại Trang chủ</a>
            </div>
        </body>
        </html>
    `);
});

// 500 error handler
app.use((err, req, res, next) => {
    console.error(JSON.stringify({
        event: "server_error",
        error: err.message,
        path: req.originalUrl,
        method: req.method
    }));
    res.status(500).send("Đã xảy ra lỗi máy chủ nội bộ");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(JSON.stringify({
        event: "server_started",
        port: PORT,
        node_env: process.env.NODE_ENV || "development"
    }));
});
