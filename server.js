// ========== IMAGE STORAGE INIT ========= //
const multer = require("./multer");

const s3 = require("./aws");

const conf = require("./config");

// ========== SERVER INIT ========= //
const db = require("./db");
const express = require("express");
const morgan = require("morgan");

const app = express();
app.use(morgan("tiny"));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// ========= ROUTES ========= //
app.get("/images", (req, res) =>
    db.getImages().then((results) => res.json(results))
);

app.post(
    "/upload",
    multer.uploader.single("file"),
    (req, res, next) => (!req.file ? res.json({ success: false }) : next()),
    s3.upload,
    validateData,
    (req, res) =>
        db
            .addImage(
                `${conf.s3Url}/${conf.s3Bucket}/${req.file.filename}`,
                req.body
            )
            .then((results) =>
                res.json({
                    success: true,
                    url: results.rows[0].url,
                })
            )
);

// ========= END ========= //
app.listen(8080, () => {
    console.log("listening");
});

// ========== HELPERS ========== //

function validateData(req, res, next) {
    const { title, username, description } = req.body;
    // if (!title )
    next();
}
