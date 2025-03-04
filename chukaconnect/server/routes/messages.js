import express from "express";
import { verifyToken } from "../middleware/auth.js";
import multer from "multer";
import { 
    getRecentMessages,
    getConversation,
    sendMessage,
    reactToMessage,
    forwardMessage,
    deleteMessage,
    uploadFile,
    markAsRead
} from "../controllers/messages.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/assets/messages");
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname);
    },
});
const upload = multer({ storage });

/* READ */
router.get("/recent", verifyToken, getRecentMessages);
router.get("/conversation/:otherUserId", verifyToken, getConversation);

/* WRITE */
router.post("/send", verifyToken, sendMessage);
router.post("/upload", verifyToken, upload.single("file"), uploadFile);
router.patch("/:messageId/read", verifyToken, markAsRead);
router.patch("/:messageId/react", verifyToken, reactToMessage);
router.post("/forward", verifyToken, forwardMessage);
router.delete("/:messageId", verifyToken, deleteMessage);

export default router;
