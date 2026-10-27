import express from "express";
import { createGroup, joinGroup, getMyGroups, getGroupById, removeMember } from "../controllers/groupController.js";
import { protect, requireGroupMember, requireGroupAdmin } from "../middleware/auth.js";
const router = express.Router(); router.use(protect);
router.post("/", createGroup); router.post("/join", joinGroup); router.get("/", getMyGroups);
router.get("/:groupId", requireGroupMember, getGroupById);
router.post("/:groupId/remove-member", requireGroupMember, requireGroupAdmin, removeMember);
export default router;