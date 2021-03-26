const spicedPg = require("spiced-pg");

const db = spicedPg(
    process.env.DATABASE_URL || "postgres:leo@localhost/imgboard"
);

module.exports = {
    getImages: () =>
        db.query(
            `SELECT url, title, description, id, (
                SELECT id FROM images
                ORDER BY id ASC
                LIMIT 1
                ) AS "lowestId" FROM images
                ORDER BY id DESC
                LIMIT 12`
        ),
    getMore: (lastId) =>
        db.query(
            `SELECT url, title, description, id, (
                SELECT id FROM images
                ORDER BY id ASC
                LIMIT 1
                ) AS "lowestId" FROM images
                WHERE id < $1
                ORDER BY id DESC
                LIMIT 12`,
            [lastId]
        ),
    addImage: (url, { username, title, description }) =>
        db.query(
            `INSERT INTO images (url, username, title, description)
                VALUES ($1, $2, $3, $4)
                RETURNING url`,
            [url, username, title, description]
        ),
    getImage: (imgId) =>
        db.query(
            `SELECT url, username, title, description, created_at
                FROM images
                WHERE id = $1`,
            [imgId]
        ),
    getComments: (imgId) =>
        db.query(
            `SELECT * FROM comments
                WHERE image_id = $1
                ORDER BY created_at DESC`,
            [imgId]
        ),
    addComment: ({ id, username, content }) =>
        db.query(
            `INSERT INTO comments (image_id, username, content)
            VALUES ($1, $2, $3)
            RETURNING image_id`,
            [id, username, content]
        ),
    // .then((results) => results.rows[0].image_id)
    // .then((imgId) => this.getComments(imgId)),
};
