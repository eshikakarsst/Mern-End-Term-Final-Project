import mongoose from "mongoose";
const rsvpSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["yes", "no", "maybe"], default: "maybe" }
}, { _id: false });
const schema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
  title: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  durationMins: { type: Number, required: true, min: 15 },
  mode: { type: String, enum: ["online", "offline"], default: "online" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rsvps: [rsvpSchema]
}, { timestamps: true });
export default mongoose.model("Session", schema);