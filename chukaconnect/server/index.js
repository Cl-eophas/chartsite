import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messages.js";
import notificationRoutes from "./routes/notifications.js";
import searchRoutes from "./routes/search.js";
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

// Basic CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(express.json());

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

/* FILE STORAGE */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "public/assets";
    
    // Create folders if they don't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
    return;
  }
  
  // Accept videos
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
    return;
  }
  
  // Accept audio
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
    return;
  }
  
  // Accept common document types
  const allowedDocs = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'text/plain'
  ];
  
  if (allowedDocs.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  
  cb(null, false);
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

app.use("/assets", express.static(path.join(__dirname, "public/assets")));

/* ROUTES */
console.log('Setting up routes...');

// Auth routes (including file upload routes)
app.use("/auth", authRoutes);
console.log('Auth routes mounted at /auth');

// Other routes
app.use("/users", userRoutes);
app.use("/posts", verifyToken, postRoutes);
app.use("/messages", messageRoutes);
app.use("/notifications", notificationRoutes);
app.use("/search", searchRoutes);

// Debug: Print registered routes
console.log('Registered routes:');
app._router.stack.forEach(layer => {
  if (layer.route) {
    console.log(`Direct route: ${layer.route.stack[0].method.toUpperCase()} ${layer.route.path}`);
  } else if (layer.name === 'router') {
    layer.handle.stack.forEach(handler => {
      if (handler.route) {
        console.log(`Router route: ${handler.route.stack[0].method.toUpperCase()} ${handler.route.path}`);
      }
    });
  }
});

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), register);
app.post("/posts", verifyToken, upload.single("picture"), createPost);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    
    // Handle MongoDB connection errors
    if (!mongoose.connection.readyState) {
        return res.status(503).json({
            success: false,
            msg: "Database connection is not available. Please try again later.",
            code: "DB_UNAVAILABLE"
        });
    }
    
    res.status(500).json({
        success: false,
        msg: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler - must be after all routes
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: "Not Found",
    message: `The requested resource was not found: ${req.method} ${req.originalUrl}`
  });
});

/* MONGOOSE SETUP */
async function connectDB() {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log('MongoDB already connected');
            return;
        }

        mongoose.set('strictQuery', false);
        mongoose.set('debug', true);
        
        const options = {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            maxPoolSize: 50,
            minPoolSize: 5,
            retryWrites: true,
            retryReads: true,
            w: 'majority',
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverApi: {
                version: '1',
                strict: true,
                deprecationErrors: true
            }
        };

        await mongoose.connect(process.env.MONGO_URL, options);
        console.log('MongoDB connected successfully');

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
            if (err.name === 'MongoServerSelectionError') {
                console.error('\nPlease check:');
                console.error('1. Your MongoDB Atlas IP whitelist settings at: https://cloud.mongodb.com');
                console.error('2. Your network connection');
                console.error('3. MongoDB Atlas server status');
            }
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
            setTimeout(connectDB, 5000);
        });

    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        if (err.name === 'MongoServerSelectionError') {
            console.error('\nConnection Error: Cannot connect to MongoDB Atlas');
            console.error('\nTo fix this:');
            console.error('1. Go to MongoDB Atlas: https://cloud.mongodb.com');
            console.error('2. Click on Network Access');
            console.error('3. Click "Add IP Address"');
            console.error('4. Click "Add Current IP Address" or use "Allow Access from Anywhere" (0.0.0.0/0)');
            console.error('5. Click "Confirm"');
            console.error('\nAfter adding your IP, restart this server.\n');
        }
        setTimeout(connectDB, 5000);
    }
}

// Initialize MongoDB connection
connectDB().catch(console.error);

let PORT = process.env.PORT || 6001;

// Ensure database connection before starting server
(async () => {
    let retries = 5;
    let server;

    while (retries > 0) {
        try {
            await connectDB();
            
            server = app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
                console.log('MongoDB Connection State:', mongoose.connection.readyState);
            });

            server.on('error', async (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.log(`Port ${PORT} is in use, trying ${PORT + 1}`);
                    PORT++;
                    await new Promise(resolve => server.close(resolve));
                    server = app.listen(PORT, () => {
                        console.log(`Server running on port ${PORT}`);
                    });
                } else {
                    console.error('Server error:', error);
                }
            });

            // Connection successful, break the retry loop
            break;

        } catch (err) {
            console.error(`Connection attempt failed. ${retries - 1} retries left`);
            retries--;
            if (retries === 0) {
                console.error('Failed to connect to database after 5 attempts');
                process.exit(1);
            }
            // Wait 5 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        try {
            if (mongoose.connection.readyState === 1) {
                await mongoose.connection.close();
                console.log('MongoDB connection closed');
            }
            if (server) {
                server.close(() => {
                    console.log('Server closed');
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        } catch (err) {
            console.error('Error during shutdown:', err);
            process.exit(1);
        }
    });
})();

/* ADD DATA ONE TIME */
// User.insertMany(users);
// Post.insertMany(posts);
