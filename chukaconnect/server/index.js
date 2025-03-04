import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messages.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* FILE STORAGE */
const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
const allowedDocumentTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
const allowedAudioTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "public/assets";
    
    // Validate file types based on field name
    let isValid = false;
    if (file.fieldname === "picture" && allowedImageTypes.includes(file.mimetype)) {
      isValid = true;
    } else if (file.fieldname === "clip" && allowedVideoTypes.includes(file.mimetype)) {
      uploadPath = "public/assets/clips";
      isValid = true;
    } else if (file.fieldname === "document" && allowedDocumentTypes.includes(file.mimetype)) {
      uploadPath = "public/assets/documents";
      isValid = true;
    } else if (file.fieldname === "audio" && allowedAudioTypes.includes(file.mimetype)) {
      uploadPath = "public/assets/audio";
      isValid = true;
    }

    if (!isValid) {
      return cb(new Error("Invalid file type"), false);
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate a safe filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "picture" && allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else if (file.fieldname === "clip" && allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else if (file.fieldname === "document" && allowedDocumentTypes.includes(file.mimetype)) {
    cb(null, true);
  } else if (file.fieldname === "audio" && allowedAudioTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  }
});

const uploadFields = upload.fields([
  { name: "picture", maxCount: 1 },
  { name: "clip", maxCount: 1 },
  { name: "document", maxCount: 1 },
  { name: "audio", maxCount: 1 },
]);

/* Error handling middleware */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: true,
      message: "File upload error: " + err.message
    });
  } else if (err) {
    return res.status(400).json({
      error: true,
      message: err.message
    });
  }
  next();
});

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), register);
app.post("/posts", verifyToken, uploadFields, createPost);

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/messages", messageRoutes);

/* MONGOOSE SETUP */
mongoose.set('strictQuery', true);
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
  })
  .catch((error) => console.log(`${error} did not connect`));