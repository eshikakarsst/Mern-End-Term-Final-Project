import Resource from "../models/Resource.js";
import Topic from "../models/Topic.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const addResource = asyncHandler(async (req, res) => {
  const { type, topicId } = req.body;
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const url = typeof req.body.url === "string" ? req.body.url.trim() : "";
  if (!title || !type || !url || !topicId) return res.status(400).json({ message: "title, type, url, topicId are required" });
  if (title.length > 100) return res.status(400).json({ message: "Resource title must be 100 characters or fewer" });
  if (!["file", "link"].includes(type)) return res.status(400).json({ message: "type must be 'file' or 'link'" });
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ message: "A valid resource URL is required" });
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) return res.status(400).json({ message: "Resource URLs must use HTTP or HTTPS" });
  const topic = await Topic.findOne({ _id: topicId, group: req.group._id });
  if (!topic) return res.status(404).json({ message: "Topic not found" });
  if (await Resource.exists({ topic: topicId, url })) return res.status(409).json({ message: "This resource was already added" });
  res.status(201).json(await Resource.create({ topic: topicId, group: req.group._id, uploadedBy: req.user._id, type, title, url }));
});
export const getResourcesByTopic = asyncHandler(async (req, res) => {
  if (!(await Topic.exists({ _id: req.params.topicId, group: req.group._id }))) return res.status(404).json({ message: "Topic not found" });
  res.json(await Resource.find({ topic: req.params.topicId, group: req.group._id }).populate("uploadedBy", "name"));
});
export const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findOne({ _id: req.params.resourceId, group: req.group._id });
  if (!resource) return res.status(404).json({ message: "Resource not found" });
  if (resource.uploadedBy.toString() !== req.user._id.toString() && req.membership.role !== "admin") return res.status(403).json({ message: "Not allowed to delete this resource" });
  await resource.deleteOne(); res.json({ message: "Resource deleted" });
});