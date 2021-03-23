const express = require("express");
const morgan = require("morgan");
const db = require("./db");
const app = express();

app.use(morgan("tiny"));

app.use(express.static("public"));

app.get("/images", (req, res) =>
    db.getImages().then((results) => res.json(results))
);

app.listen(8080, () => {
    console.log("listening");
});
