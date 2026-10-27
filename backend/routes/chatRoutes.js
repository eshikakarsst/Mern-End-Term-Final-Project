import express from "express";
import { getGroupMessages } from "../controllers/chatController.js";
import { protect, requireGroupMember } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.get("/:groupId/messages", requireGroupMember, getGroupMessages);
export default router;
