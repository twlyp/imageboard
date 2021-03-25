const ERR = {
    inputData: "Please input valid data.",
    fsWrite: "I couldn't save the file on the filesystem.",
    dbWrite: "I couldn't add your entry to the database.",
    dbRead: "I couldn't find this entry in the database.",
};

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
    (req, res, next) =>
        !req.file ? res.json({ success: false, error: ERR.fsWrite }) : next(),
    s3.upload,
    validateMetadata,
    (req, res, next) =>
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
            .catch((err) => {
                res.json({ success: false, error: ERR.dbWrite });
                next(err);
            })
);

app.get("/details", validateId, (req, res, next) =>
    db
        .getImage(req.query.id)
        .then((results) =>
            res.json({ success: true, imgData: results.rows[0] })
        )
        .catch((err) => {
            res.json({ success: false, error: ERR.dbRead });
            next(err);
        })
);

// ========== ERRORS ========== //
app.use((err, req, res, next) => {
    console.error(`${err.name}: ${err.stack}`);
});

// ========= END ========= //
app.listen(8080, () => {
    console.log("listening");
});

// ========== HELPERS ========== //

function validateMetadata(req, res, next) {
    let { title, username, description } = req.body;
    if (title && username) {
        return next();
    }
    return res.json({ success: false, error: ERR.inputData });
}

function validateId(req, res, next) {
    if (req.query.id) {
        req.query.id = parseInt(req.query.id);
        return next();
    }
    return res.json({ success: false, error: ERR.inputData });
}
