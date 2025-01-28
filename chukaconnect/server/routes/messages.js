import express from 'express';
import { deleteMessage, getUnreadMessageCount } from '../controllers/messages.js';

const router = express.Router();

// Existing routes...

// Route for deleting a message
router.delete('/messages/:messageId', deleteMessage);

// Route for getting unread message count
router.get('/messages/unread/count/:userId', getUnreadMessageCount);

export default router;
