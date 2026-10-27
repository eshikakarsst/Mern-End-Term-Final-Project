import express from "express";
import { createSession, getSessionsByGroup, rsvpSession, deleteSession } from "../controllers/sessionController.js";
import { protect, requireGroupMember } from "../middleware/auth.js";
const router = express.Router(); router.use(protect);
router.post("/:groupId", requireGroupMember, createSession); router.get("/:groupId", requireGroupMember, getSessionsByGroup);
router.patch("/:groupId/:sessionId/rsvp", requireGroupMember, rsvpSession); router.delete("/:groupId/:sessionId", requireGroupMember, deleteSession);
export default router;