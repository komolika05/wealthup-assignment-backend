require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

const app = express();
app.use(express.json());
app.use(cors());

// AWS CONFIGURATION
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// MULTER SETUP (Handles the file input), We use memoryStorage to keep the file in RAM temporarily
const upload = multer({ storage: multer.memoryStorage() });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected successfully");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};
connectDB();

app.get("/", (req, res) => {
  res.send("Server is running and healthy!");
});

const JobSchema = new mongoose.Schema({
  fileKey: { type: String, required: true },
  status: {
    type: String,
    enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
    default: "PENDING",
  },
  createdAt: { type: Date, default: Date.now },
  error: String,
});

const Job = mongoose.model("Job", JobSchema);

const FileDataSchema = new mongoose.Schema({
  content: String,
  originalFile: String,
});

const FileData = mongoose.model("FileData", FileDataSchema);

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;

    const uploadParams = {
      client: s3,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer, // The actual file data
        ContentType: req.file.mimetype,
      },
    };

    const parallelUploads3 = new Upload(uploadParams);

    const result = await parallelUploads3.done();

    res.json({
      message: "File uploaded successfully",
      fileUrl: result.Location,
      fileName: fileName,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.post("/process/:fileKey", async (req, res) => {
  try {
    const { fileKey } = req.params;

    const newJob = await Job.create({
      fileKey: fileKey,
    });

    res.json({
      message: "Job created successfully",
      jobId: newJob._id,
      status: "PENDING",
    });

    // TODO: We will trigger the worker here in the next step
  } catch (error) {
    console.error("Job Creation Error:", error);
    res.status(500).json({ error: "Could not create job" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
