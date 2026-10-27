import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const getMyNotifications = asyncHandler(async (req, res) => res.json(await Notification.find({ user: req.user._id }).sort("-createdAt").limit(50)));
export const markAsRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
  if (!item) return res.status(404).json({ message: "Notification not found" }); res.json(item);
});
export const markAllRead = asyncHandler(async (req, res) => { await Notification.updateMany({ user: req.user._id, read: false }, { read: true }); res.json({ message: "All notifications marked as read" }); });