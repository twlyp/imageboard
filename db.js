const spicedPg = require("spiced-pg");

const db = spicedPg(
    process.env.DATABASE_URL || "postgres:leo@localhost/imgboard"
);

const querify = (...args) => [...args].join(" ");

module.exports = {
    getImages: () => db.query("SELECT * FROM images " + "ORDER BY id DESC"),
    addImage: (url, { username, title, description }) =>
        db.query(
            querify(
                "INSERT INTO images (url, username, title, description)",
                "VALUES ($1, $2, $3, $4)",
                "RETURNING url"
            ),
            [url, username, title, description]
        ),
    getImage: (id) =>
        db.query(
            querify(
                "SELECT url, username, title, description, created_at",
                "FROM images",
                "WHERE id = $1"
            ),
            [id]
        ),
};
