import express from "express";
import { addResource, getResourcesByTopic, deleteResource } from "../controllers/resourceController.js";
import { protect, requireGroupMember } from "../middleware/auth.js";
const router = express.Router(); router.use(protect);
router.post("/:groupId", requireGroupMember, addResource);
router.get("/:groupId/topic/:topicId", requireGroupMember, getResourcesByTopic);
router.delete("/:groupId/:resourceId", requireGroupMember, deleteResource);
export default router;