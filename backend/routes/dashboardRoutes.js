import express from "express";
import { getGroupDashboard } from "../controllers/dashboardController.js";
import { protect, requireGroupMember } from "../middleware/auth.js";
const router = express.Router(); router.use(protect); router.get("/:groupId", requireGroupMember, getGroupDashboard);
export default router;