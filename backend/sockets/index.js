import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Group from "../models/Group.js";
import GroupMessage from "../models/GroupMessage.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

let ioInstance;

export const initSocket = io => {
  ioInstance = io;

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return next(new Error(error?.name === "TokenExpiredError" ? "Access token expired" : "Invalid authentication token"));
    }
    try {
      const user = await User.findById(decoded.id).select("_id name").lean();
      if (!user) return next(new Error("User no longer exists"));
      socket.data.user = user;
      return next();
    } catch {
      return next(new Error("Authentication service unavailable"));
    }
  });

  io.on("connection", socket => {
    socket.join(`user_${socket.data.user._id}`);

    socket.on("joinGroupRoom", async (groupId, acknowledge) => {
      try {
        if (!mongoose.isValidObjectId(groupId)) return acknowledge?.({ error: "Invalid group ID" });
        const group = await Group.findOne({ _id: groupId, "members.user": socket.data.user._id }).select("_id");
        if (!group) return acknowledge?.({ error: "Group membership required" });
        await socket.join(`group_${groupId}`);
        acknowledge?.({ ok: true });
      } catch {
        acknowledge?.({ error: "Could not join this group" });
      }
    });

    socket.on("chat:send", async (payload, acknowledge) => {
      try {
        const groupId = payload?.groupId;
        const text = typeof payload?.text === "string" ? payload.text.trim() : "";
        if (!mongoose.isValidObjectId(groupId)) return acknowledge?.({ error: "Invalid group ID" });
        if (!text || text.length > 2000) return acknowledge?.({ error: "Message must be between 1 and 2000 characters" });
        const group = await Group.findOne({ _id: groupId, "members.user": socket.data.user._id }).select("_id name members.user");
        if (!group) return acknowledge?.({ error: "Group membership required" });
        if (!socket.rooms.has(`group_${groupId}`)) await socket.join(`group_${groupId}`);
        const message = await GroupMessage.create({ group: group._id, sender: socket.data.user._id, text });
        const populated = await message.populate("sender", "name");
        io.to(`group_${groupId}`).emit("chat:message", populated);
        const recipients = group.members
          .map(member => member.user)
          .filter(userId => userId.toString() !== socket.data.user._id.toString());
        if (recipients.length) {
          try {
            const notifications = await Notification.insertMany(recipients.map(userId => ({
              user: userId,
              message: `${socket.data.user.name} sent a message in ${group.name}`,
              link: `/groups/${groupId}/chat`
            })));
            notifications.forEach(notification => {
              io.to(`user_${notification.user}`).emit("notification:new", notification);
            });
          } catch (error) {
            console.error("Could not create chat notifications:", error);
          }
        }
        acknowledge?.({ ok: true });
      } catch {
        acknowledge?.({ error: "Message could not be sent" });
      }
    });
  });
};

export const emitToGroup = (groupId, event, payload) => {
  if (ioInstance) ioInstance.to(`group_${groupId}`).emit(event, payload);
};

export const removeUserFromGroup = async (groupId, userId) => {
  if (!ioInstance) return;
  const sockets = await ioInstance.in(`group_${groupId}`).fetchSockets();
  await Promise.all(sockets
    .filter(socket => socket.data.user?._id.toString() === userId.toString())
    .map(socket => socket.leave(`group_${groupId}`)));
};
