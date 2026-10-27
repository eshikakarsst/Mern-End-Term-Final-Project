import Topic from "../models/Topic.js";
import Subject from "../models/Subject.js";
import Session from "../models/Session.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const getGroupDashboard = asyncHandler(async (req, res) => {
  const groupId = req.group._id;
  const topics = await Topic.find({ group: groupId }).populate("assignedTo", "name");
  const total = topics.length, done = topics.filter(t => t.status === "done").length;
  const inProgress = topics.filter(t => t.status === "in_progress").length, notStarted = topics.filter(t => t.status === "not_started").length;
  const subjects = await Subject.find({ group: groupId });
  const subjectBreakdown = subjects.map(s => {
    const ts = topics.filter(t => t.subject.toString() === s._id.toString()), completed = ts.filter(t => t.status === "done").length;
    return { subjectId: s._id, title: s.title, total: ts.length, done: completed, completionRate: ts.length ? Math.round(completed / ts.length * 100) : 0 };
  });
  const members = {};
  topics.forEach(t => t.assignedTo.forEach(m => {
    const id = m._id.toString(); members[id] ||= { name: m.name, assigned: 0, completed: 0 };
    members[id].assigned++; if (t.status === "done") members[id].completed++;
  }));
  const cutoff = new Date(Date.now() - 3 * 86400000);
  const staleTopics = topics.filter(t => t.status !== "done" && t.statusUpdatedAt < cutoff).map(t => ({ id: t._id, title: t.title, status: t.status, statusUpdatedAt: t.statusUpdatedAt }));
  const upcomingSessions = await Session.countDocuments({ group: groupId, scheduledAt: { $gte: new Date() } });
  res.json({ totals: { total, done, inProgress, notStarted, completionRate: total ? Math.round(done / total * 100) : 0 }, subjectBreakdown, memberBreakdown: Object.values(members), staleTopics, upcomingSessions });
});