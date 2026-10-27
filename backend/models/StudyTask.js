import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  dueAt: { type: Date, required: true },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

schema.index({ user: 1, dueAt: 1 });
export default mongoose.model("StudyTask", schema);
