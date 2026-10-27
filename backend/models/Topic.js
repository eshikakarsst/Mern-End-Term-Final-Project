import mongoose from "mongoose";
const schema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  title: { type: String, required: true, trim: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["not_started", "in_progress", "done"], default: "not_started" },
  statusUpdatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
export default mongoose.model("Topic", schema);