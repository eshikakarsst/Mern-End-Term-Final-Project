import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Not authorized, no token" });
  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User no longer exists" });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
});
export const requireGroupMember = asyncHandler(async (req, res, next) => {
  const groupId = req.params.groupId || req.body.group || req.params.id;
  if (!groupId) return res.status(400).json({ message: "Group ID is required" });
  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });
  const membership = group.members.find(m => m.user.toString() === req.user._id.toString());
  if (!membership) return res.status(403).json({ message: "Not a member of this group" });
  req.group = group; req.membership = membership; next();
});
export const requireGroupAdmin = (req, res, next) => {
  if (req.membership?.role !== "admin") return res.status(403).json({ message: "Admin privileges required" });
  next();
};