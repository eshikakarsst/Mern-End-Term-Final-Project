import express from "express";
import { getMyNotifications, markAsRead, markAllRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";
const router = express.Router(); router.use(protect);
router.patch("/read-all", markAllRead); router.get("/", getMyNotifications); router.patch("/:id/read", markAsRead);
export default router;