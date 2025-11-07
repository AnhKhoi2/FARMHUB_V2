import * as chatService from "../services/chatService.js";

export async function open(req, res) {
  try {
    const me = req.user.id;
    const { expertId, userId } = req.body || {};
    const conv = await chatService.openConversation({ me, expertId, userId });
    return res.json({ data: conv });
  } catch (err) {
    console.error("chat.open error:", err);
    return res.status(400).json({ error: err.message });
  }
}

export async function listMy(req, res) {
  try {
    const me = req.user.id;
    const items = await chatService.listMyConversations(me);
    return res.json({ data: items });
  } catch (err) {
    console.error("chat.list error:", err);
    return res.status(500).json({ error: "Failed to list conversations" });
  }
}

export async function messages(req, res) {
  try {
    const me = req.user.id;
    const { id } = req.params;
    const { before, limit } = req.query;
    const { messages, nextCursor } = await chatService.getMessages({ conversationId: id, me, before, limit });
    return res.json({ data: messages, nextCursor });
  } catch (err) {
    console.error("chat.messages error:", err);
    return res.status(500).json({ error: err.message });
  }
}
