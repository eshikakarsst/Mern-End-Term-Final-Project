import mongoose from "mongoose";
const schema = new mongoose.Schema({
  topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["file", "link"], required: true },
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true }
}, { timestamps: true });
export default mongoose.model("Resource", schema);