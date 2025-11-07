import { Server } from "socket.io";
import { socketAuth } from "./socketAuth.js";
import registerChatNamespace from "./chat.socket.js";

export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: ["http://localhost:5173"], credentials: true },
  });

  socketAuth(io);
  registerChatNamespace(io);
  console.log("✅ Socket.IO initialized");
  return io;
}
