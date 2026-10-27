import express from "express";
import { createSubject, getSubjectsByGroup, deleteSubject } from "../controllers/subjectController.js";
import { protect, requireGroupMember, requireGroupAdmin } from "../middleware/auth.js";
const router = express.Router(); router.use(protect);
router.post("/:groupId", requireGroupMember, requireGroupAdmin, createSubject);
router.get("/:groupId", requireGroupMember, getSubjectsByGroup);
router.delete("/:groupId/:subjectId", requireGroupMember, requireGroupAdmin, deleteSubject);
export default router;