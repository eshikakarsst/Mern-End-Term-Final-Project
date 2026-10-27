import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 }
}, { timestamps: true });
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
});
userSchema.methods.matchPassword = function (entered) { return bcrypt.compare(entered, this.password); };
userSchema.set("toJSON", { transform: (_doc, ret) => { delete ret.password; delete ret.__v; return ret; } });
export default mongoose.model("User", userSchema);