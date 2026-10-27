import mongoose from "mongoose";
import Group from "../models/Group.js";
import StudyTask from "../models/StudyTask.js";
import Topic from "../models/Topic.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getTasks = asyncHandler(async (req, res) => {
  const query = { user: req.user._id };
  if (req.query.from || req.query.to) {
    query.dueAt = {};
    if (req.query.from) {
      const from = new Date(req.query.from);
      if (Number.isNaN(from.getTime())) return res.status(400).json({ message: "Invalid from date" });
      query.dueAt.$gte = from;
    }
    if (req.query.to) {
      const to = new Date(req.query.to);
      if (Number.isNaN(to.getTime())) return res.status(400).json({ message: "Invalid to date" });
      query.dueAt.$lte = to;
    }
  }
  if (req.query.groupId) {
    if (!mongoose.isValidObjectId(req.query.groupId)) return res.status(400).json({ message: "Invalid groupId" });
    const group = await Group.findById(req.query.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.some(member => member.user.toString() === req.user._id.toString())) return res.status(403).json({ message: "Not a member of this group" });
    query.group = group._id;
  }
  res.json(await StudyTask.find(query).populate("group", "name").populate("topic", "title").sort({ dueAt: 1 }));
});

export const createTask = asyncHandler(async (req, res) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const dueAt = new Date(req.body.dueAt);
  if (!title || title.length > 140 || typeof req.body.dueAt !== "string" || !req.body.dueAt.trim() || Number.isNaN(dueAt.getTime())) {
    return res.status(400).json({ message: "A title (up to 140 characters) and valid due date are required" });
  }
  if (req.body.notes !== undefined && typeof req.body.notes !== "string") return res.status(400).json({ message: "Notes must be text" });
  if ((req.body.notes?.length || 0) > 1000) return res.status(400).json({ message: "Notes must be 1000 characters or fewer" });
  let group;
  if (req.body.groupId) {
    if (!mongoose.isValidObjectId(req.body.groupId)) return res.status(400).json({ message: "Invalid groupId" });
    group = await Group.findById(req.body.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.some(member => member.user.toString() === req.user._id.toString())) return res.status(403).json({ message: "Not a member of this group" });
  }
  let topic;
  if (req.body.topicId) {
    if (!group) return res.status(400).json({ message: "A group is required when linking a topic" });
    if (!mongoose.isValidObjectId(req.body.topicId)) return res.status(400).json({ message: "Invalid topicId" });
    topic = await Topic.findOne({ _id: req.body.topicId, group: group._id });
    if (!topic) return res.status(404).json({ message: "Topic not found in this group" });
  }
  const task = await StudyTask.create({
    user: req.user._id,
    group: group?._id,
    topic: topic?._id,
    title,
    notes: req.body.notes?.trim() || "",
    dueAt
  });
  res.status(201).json(await task.populate([{ path: "group", select: "name" }, { path: "topic", select: "title" }]));
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await StudyTask.findOne({ _id: req.params.taskId, user: req.user._id });
  if (!task) return res.status(404).json({ message: "Task not found" });
  if (typeof req.body.completed === "boolean") task.completed = req.body.completed;
  if (req.body.title !== undefined) {
    if (typeof req.body.title !== "string") return res.status(400).json({ message: "Title must be text" });
    const title = req.body.title.trim();
    if (!title || title.length > 140) return res.status(400).json({ message: "Title must be between 1 and 140 characters" });
    task.title = title;
  }
  if (req.body.notes !== undefined) {
    if (typeof req.body.notes !== "string") return res.status(400).json({ message: "Notes must be text" });
    const notes = req.body.notes.trim();
    if (notes.length > 1000) return res.status(400).json({ message: "Notes must be 1000 characters or fewer" });
    task.notes = notes;
  }
  if (req.body.dueAt !== undefined) {
    if (typeof req.body.dueAt !== "string" || !req.body.dueAt.trim()) return res.status(400).json({ message: "Invalid dueAt date" });
    const dueAt = new Date(req.body.dueAt);
    if (Number.isNaN(dueAt.getTime())) return res.status(400).json({ message: "Invalid dueAt date" });
    task.dueAt = dueAt;
  }
  await task.save();
  res.json(await task.populate([{ path: "group", select: "name" }, { path: "topic", select: "title" }]));
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await StudyTask.findOneAndDelete({ _id: req.params.taskId, user: req.user._id });
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json({ message: "Task deleted" });
});
