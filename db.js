const spicedPg = require("spiced-pg");

const db = spicedPg(
    process.env.DATABASE_URL || "postgres:leo@localhost/imgboard"
);

module.exports = {
    getImages: () => db.query("SELECT * FROM images"),
};
