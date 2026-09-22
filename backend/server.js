```js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  S3Client,
  PutObjectCommand
} = require("@aws-sdk/client-s3");

const app = express();

const PORT = process.env.PORT || 80;
const USE_S3 = process.env.USE_S3 === "true";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION || "eu-north-1";

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir
});

const s3 = new S3Client({
  region: AWS_REGION
});

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.post("/upload", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded"
      });
    }

    let s3Key = null;

    if (!USE_S3) {
      console.log("Local upload:");
      console.log("File:", req.file.originalname);
      console.log("Saved:", req.file.path);
    }

    if (USE_S3) {
      if (!S3_BUCKET_NAME) {
        return res.status(500).json({
          error: "S3_BUCKET_NAME is not configured"
        });
      }

      const fileBuffer = fs.readFileSync(req.file.path);

      s3Key = `uploads/${Date.now()}-${req.file.originalname}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: req.file.mimetype
        })
      );

      fs.unlinkSync(req.file.path);

      console.log("S3 upload successful:");
      console.log("Bucket:", S3_BUCKET_NAME);
      console.log("Key:", s3Key);
    }

    return res.status(200).json({
      message: USE_S3
        ? "File uploaded to S3"
        : "File uploaded locally",
      filename: req.file.originalname,
      s3Key: s3Key
    });

  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      error: "Upload failed"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Insurance Portal running at http://localhost:${PORT}`
  );
});
```
