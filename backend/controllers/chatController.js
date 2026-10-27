import GroupMessage from "../models/GroupMessage.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getGroupMessages = asyncHandler(async (req, res) => {
  const messages = await GroupMessage.find({ group: req.group._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("sender", "name");
  res.json(messages.reverse());
});
