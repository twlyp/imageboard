const ERR = {
    inputData: "Please input valid data.",
    fsWrite:
        "I couldn't save the file on the filesystem. Maybe the file is too big? (max 2 MB)",
    dbWrite: "I couldn't add your entry to the database.",
    dbRead: "I couldn't find this entry in the database.",
    badData: "Your request contains invalid data.",
    noMore: "There are no more images to show.",
};

// ========== IMAGE STORAGE INIT ========= //
const multer = require("./multer");

const s3 = require("./aws");

const conf = require("./config");

// ========== SERVER INIT ========= //
const db = require("./db");
const express = require("express");
// const morgan = require("morgan");

const app = express();
// app.use(morgan("tiny"));
app.use(express.static("public"));
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(
    express.urlencoded({
        extended: false,
    })
);

// ========= ROUTES ========= //
app.get("/images", (req, res, next) =>
    db
        .getImages()
        .then((results) => res.json({ success: true, rows: results.rows }))
        .catch((err) => {
            res.json({ success: false, error: ERR.dbRead });
            next(err);
        })
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
                    id: results.rows[0].id,
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
        .then((results) => {
            if (results.rows.length === 1)
                return res.json({ success: true, imgData: results.rows[0] });
            return res.json({ success: false, error: ERR.Read });
        })
        .catch((err) => {
            res.json({ success: false, error: ERR.dbRead });
            next(err);
        })
);

app.get("/more", validateId, (req, res, next) =>
    db
        .getMore(req.query.id)
        .then((results) => {
            if (results.rows.length === 0)
                return res.json({ success: false, error: ERR.noMore });
            return res.json({ success: true, rows: results.rows });
        })
        .catch((err) => {
            res.json({ success: false, error: ERR.dbRead });
            return next(err);
        })
);

app.route("/comments")
    .get(validateId, (req, res, next) =>
        db
            .getComments(req.query.id)
            .then((results) => res.json({ success: true, rows: results.rows }))
            .catch((err) => {
                res.json({ success: false, error: ERR.dbRead });
                return next(err);
            })
    )
    .post(validateComment, (req, res, next) =>
        db
            .addComment(req.body)
            .then(() => res.json({ success: true }))
            .catch((err) => {
                res.json({ success: false, error: ERR.dbWrite });
                return next(err);
            })
    );

// ========== ERRORS ========== //
app.use((err, req, res, next) => {
    return res.json({ success: false, error: `${err.name}: ${err.message}` });
});

// ========= END ========= //
app.listen(process.env.PORT || 8080);

// ========== HELPERS ========== //

function validateMetadata(req, res, next) {
    let { title, username } = req.body;
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
    return res.json({ success: false, error: ERR.badData });
}

function validateComment(req, res, next) {
    if (req.body.username && req.body.content && req.body.id) return next();
    return res.json({ success: false, error: ERR.badData });
}
