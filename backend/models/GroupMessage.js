import mongoose from "mongoose";

const schema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 }
}, { timestamps: true });

schema.index({ group: 1, createdAt: -1 });
export default mongoose.model("GroupMessage", schema);
