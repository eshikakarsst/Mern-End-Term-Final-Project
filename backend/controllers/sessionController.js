import Session from "../models/Session.js";
import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emitToGroup } from "../sockets/index.js";
export const createSession = asyncHandler(async (req, res) => {
  const { title, scheduledAt, durationMins, mode, topicId } = req.body;
  if (!title?.trim() || !scheduledAt || !Number.isFinite(Number(durationMins)) || Number(durationMins) < 15) return res.status(400).json({ message: "Valid title, scheduledAt and durationMins (at least 15) are required" });
  const start = new Date(scheduledAt); const duration = Number(durationMins);
  if (Number.isNaN(start.getTime())) return res.status(400).json({ message: "Invalid scheduledAt date" });
  if (start < new Date()) return res.status(400).json({ message: "Cannot schedule a session in the past" });
  if (topicId && !(await (await import("../models/Topic.js")).default.exists({ _id: topicId, group: req.group._id }))) return res.status(400).json({ message: "Topic does not belong to this group" });
  const end = new Date(start.getTime() + duration * 60000);
  const existing = await Session.find({ group: req.group._id });
  const conflict = existing.find(s => new Date(s.scheduledAt) < end && start < new Date(new Date(s.scheduledAt).getTime() + s.durationMins * 60000));
  if (conflict) return res.status(409).json({ message: `Conflicts with existing session "${conflict.title}" at ${conflict.scheduledAt}` });
  const session = await Session.create({ group: req.group._id, topic: topicId || undefined, title: title.trim(), scheduledAt: start, durationMins: duration, mode: mode || "online", createdBy: req.user._id, rsvps: req.group.members.map(m => ({ user: m.user, status: "maybe" })) });
  const notices = req.group.members.filter(m => m.user.toString() !== req.user._id.toString()).map(m => ({ user: m.user, message: `New session "${title}" scheduled in your group`, link: `/groups/${req.group._id}/sessions` }));
  if (notices.length) await Notification.insertMany(notices);
  emitToGroup(req.group._id.toString(), "session:created", session); res.status(201).json(session);
});
export const getSessionsByGroup = asyncHandler(async (req, res) => res.json(await Session.find({ group: req.group._id }).populate("rsvps.user", "name").populate("createdBy", "name").sort("scheduledAt")));
export const rsvpSession = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["yes", "no", "maybe"].includes(status)) return res.status(400).json({ message: "Invalid RSVP status" });
  const session = await Session.findOne({ _id: req.params.sessionId, group: req.group._id });
  if (!session) return res.status(404).json({ message: "Session not found" });
  const rsvp = session.rsvps.find(r => r.user.toString() === req.user._id.toString());
  if (rsvp) rsvp.status = status; else session.rsvps.push({ user: req.user._id, status });
  await session.save(); emitToGroup(req.group._id.toString(), "session:rsvpUpdated", session); res.json(session);
});
export const deleteSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({ _id: req.params.sessionId, group: req.group._id });
  if (!session) return res.status(404).json({ message: "Session not found" });
  if (session.createdBy.toString() !== req.user._id.toString() && req.membership.role !== "admin") return res.status(403).json({ message: "Not allowed to delete this session" });
  await session.deleteOne(); res.json({ message: "Session deleted" });
});