const aws = require("aws-sdk");
const fs = require("fs");

const conf = require("./config");

const secrets =
    process.env.NODE_ENV == "production"
        ? JSON.parse(process.env.SECRETS)
        : require("./secrets");

const s3 = new aws.S3({
    accessKeyId: secrets.AWS_KEY,
    secretAccessKey: secrets.AWS_SECRET,
});

exports.upload = (req, res, next) => {
    const { filename, mimetype, size, path } = req.file;

    s3.putObject({
        Bucket: conf.s3Bucket,
        ACL: "public-read",
        Key: filename,
        Body: fs.createReadStream(path),
        ContentType: mimetype,
        ContentLength: size,
    })
        .promise()
        .then(() => {
            fs.unlink(path, () => {
                console.log(path, " deleted");
            });
            next();
        })
        .catch((err) => next(err));
};
