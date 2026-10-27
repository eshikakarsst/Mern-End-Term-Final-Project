import { nanoid } from "nanoid";
import Group from "../models/Group.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeUserFromGroup } from "../sockets/index.js";
export const createGroup = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ message: "Group name is required" });
  let inviteCode;
  do { inviteCode = nanoid(8).toUpperCase(); } while (await Group.exists({ inviteCode }));
  res.status(201).json(await Group.create({ name, inviteCode, admin: req.user._id, members: [{ user: req.user._id, role: "admin" }] }));
});
export const joinGroup = asyncHandler(async (req, res) => {
  const group = await Group.findOne({ inviteCode: req.body.inviteCode?.trim().toUpperCase() });
  if (!group) return res.status(404).json({ message: "Invalid invite code" });
  if (group.members.some(m => m.user.toString() === req.user._id.toString())) return res.status(409).json({ message: "Already a member of this group" });
  group.members.push({ user: req.user._id, role: "member" }); await group.save(); res.json(group);
});
export const getMyGroups = asyncHandler(async (req, res) => res.json(await Group.find({ "members.user": req.user._id }).populate("members.user", "name email").sort("-createdAt")));
export const getGroupById = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.groupId).populate("members.user", "name email");
  if (!group) return res.status(404).json({ message: "Group not found" }); res.json(group);
});
export const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.body; const group = req.group;
  if (!userId) return res.status(400).json({ message: "userId is required" });
  if (group.admin.toString() === userId) return res.status(400).json({ message: "Cannot remove the group admin" });
  group.members = group.members.filter(m => m.user.toString() !== userId); await group.save();
  await removeUserFromGroup(group._id.toString(), userId);
  res.json(group);
});