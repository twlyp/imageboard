const spicedPg = require("spiced-pg");

const db = spicedPg(
    process.env.DATABASE_URL || "postgres:leo@localhost/imgboard"
);

module.exports = {
    getImages: () => db.query("SELECT * FROM images " + "ORDER BY id DESC"),
    addImage: (url, { username, title, description }) =>
        db.query(
            "INSERT INTO images (url, username, title, description) " +
                "VALUES ($1, $2, $3, $4) " +
                "RETURNING url",
            [url, username, title, description]
        ),
};
