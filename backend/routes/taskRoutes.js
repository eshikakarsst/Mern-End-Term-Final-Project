import express from "express";
import { protect } from "../middleware/auth.js";
import { createTask, deleteTask, getTasks, updateTask } from "../controllers/taskController.js";

const router = express.Router();
router.use(protect);
router.route("/").get(getTasks).post(createTask);
router.route("/:taskId").patch(updateTask).delete(deleteTask);
export default router;
