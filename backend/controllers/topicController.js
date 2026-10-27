import Topic from "../models/Topic.js";
import Subject from "../models/Subject.js";
import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emitToGroup } from "../sockets/index.js";
export const createTopic = asyncHandler(async (req, res) => {
  const title = req.body.title?.trim(); if (!title) return res.status(400).json({ message: "Title is required" });
  const subject = await Subject.findOne({ _id: req.params.subjectId, group: req.group._id });
  if (!subject) return res.status(404).json({ message: "Subject not found" });
  res.status(201).json(await Topic.create({ subject: subject._id, group: req.group._id, title }));
});
export const getTopicsBySubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOne({ _id: req.params.subjectId, group: req.group._id });
  if (!subject) return res.status(404).json({ message: "Subject not found" });
  res.json(await Topic.find({ subject: subject._id }).populate("assignedTo", "name email"));
});
export const assignTopic = asyncHandler(async (req, res) => {
  const userIds = req.body.userIds;
  if (!Array.isArray(userIds)) return res.status(400).json({ message: "userIds must be an array" });
  const topic = await Topic.findOne({ _id: req.params.topicId, group: req.group._id });
  if (!topic) return res.status(404).json({ message: "Topic not found" });
  const members = req.group.members.map(m => m.user.toString());
  if (userIds.some(id => !members.includes(id))) return res.status(400).json({ message: "Some users are not members of this group" });
  topic.assignedTo = [...new Set(userIds)]; await topic.save();
  if (userIds.length) await Notification.insertMany(userIds.filter(id => id !== req.user._id.toString()).map(user => ({ user, message: `You were assigned to topic "${topic.title}"`, link: `/groups/${req.group._id}/subjects/${topic.subject}` })));
  const populated = await topic.populate("assignedTo", "name email");
  emitToGroup(req.group._id.toString(), "topic:assigned", populated); res.json(populated);
});
export const updateTopicStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["not_started", "in_progress", "done"].includes(status)) return res.status(400).json({ message: "Invalid status value" });
  const topic = await Topic.findOne({ _id: req.params.topicId, group: req.group._id });
  if (!topic) return res.status(404).json({ message: "Topic not found" });
  const assigned = topic.assignedTo.some(id => id.toString() === req.user._id.toString());
  if (!assigned && req.membership.role !== "admin") return res.status(403).json({ message: "Only assigned members or admin can update status" });
  topic.status = status; topic.statusUpdatedAt = new Date(); await topic.save();
  emitToGroup(req.group._id.toString(), "topic:statusUpdated", topic); res.json(topic);
});
export const deleteTopic = asyncHandler(async (req, res) => {
  const topic = await Topic.findOneAndDelete({ _id: req.params.topicId, group: req.group._id });
  if (!topic) return res.status(404).json({ message: "Topic not found" }); res.json({ message: "Topic deleted" });
});