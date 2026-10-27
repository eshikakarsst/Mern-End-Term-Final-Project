import Subject from "../models/Subject.js";
import Topic from "../models/Topic.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const createSubject = asyncHandler(async (req, res) => {
  const title = req.body.title?.trim(); if (!title) return res.status(400).json({ message: "Title is required" });
  res.status(201).json(await Subject.create({ group: req.group._id, title, createdBy: req.user._id }));
});
export const getSubjectsByGroup = asyncHandler(async (req, res) => res.json(await Subject.find({ group: req.group._id }).sort("-createdAt")));
export const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOne({ _id: req.params.subjectId, group: req.group._id });
  if (!subject) return res.status(404).json({ message: "Subject not found" });
  await Topic.deleteMany({ subject: subject._id }); await subject.deleteOne(); res.json({ message: "Subject deleted" });
});