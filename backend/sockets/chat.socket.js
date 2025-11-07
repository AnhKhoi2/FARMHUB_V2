import Conversation from "../models/Conversation.js";
import * as chatService from "../services/chatService.js";

export default function registerChatNamespace(io) {
  io.on("connection", (socket) => {
    socket.on("chat:join", async ({ conversationId }) => {
      try {
        const conv = await Conversation.findById(conversationId).lean();
        if (!conv) return socket.emit("error", { message: "Conversation not found" });
        const isMember = conv.participants.map(String).includes(socket.user.id);
        if (!isMember) return socket.emit("error", { message: "Not in this conversation" });
        socket.join(conversationId);
        socket.emit("chat:joined", { conversationId });
      } catch {
        socket.emit("error", { message: "Join failed" });
      }
    });

    socket.on("message:send", async ({ conversationId, text }) => {
      try {
        const msg = await chatService.createMessage({ conversationId, sender: socket.user.id, text });
        io.to(conversationId).emit("message:new", {
          _id: msg._id,
          conversation: conversationId,
          sender: msg.sender,
          text: msg.text,
          createdAt: msg.createdAt,
        });
      } catch (e) {
        socket.emit("error", { message: e?.message || "Failed to send message" });
      }
    });

    socket.on("chat:leave", ({ conversationId }) => socket.leave(conversationId));
  });
}
