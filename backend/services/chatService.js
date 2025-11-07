import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Expert from "../models/Expert.js";

export async function openConversation({ me, expertId, userId }) {
  let userA = me, userB = null, expertDoc = null;

  if (expertId) {
    expertDoc = await Expert.findOne({ expert_id: expertId }).populate("user", "_id").lean();
    if (!expertDoc?.user?._id) throw new Error("Expert not found");
    userB = expertDoc.user._id.toString();
  } else if (userId) {
    userB = userId;
  } else throw new Error("Missing expertId or userId");

  const pairKey = [userA, userB].map(String).sort().join("_");
  let conv = await Conversation.findOne({ pairKey }).lean();
  if (conv) return conv;

  conv = await Conversation.create({
    participants: [userA, userB],
    expert: expertDoc?._id || null,
    created_by: me
  });

  return conv.toObject();
}

export async function listMyConversations(me) {
  const items = await Conversation.find({ participants: me })
    .sort({ updatedAt: -1 })
    .populate({ path: "expert", select: "expert_id full_name" })
    .lean();
  return items;
}

export async function getMessages({ conversationId, me, before, limit = 20 }) {
  const conv = await Conversation.findById(conversationId).lean();
  if (!conv || !conv.participants.map(String).includes(me))
    throw new Error("Not in this conversation");

  const filter = { conversation: conversationId };
  if (before) filter.createdAt = { $lt: new Date(before) };

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .lean();

  const nextCursor = messages.length ? messages[messages.length - 1].createdAt : null;
  return { messages: messages.reverse(), nextCursor };
}

export async function createMessage({ conversationId, sender, text }) {
  const conv = await Conversation.findById(conversationId);
  if (!conv) throw new Error("Conversation not found");

  const isMember = conv.participants.map(String).includes(String(sender));
  if (!isMember) throw new Error("Not in this conversation");

  const safe = String(text || "").trim();
  if (!safe) throw new Error("Empty message");

  const msg = await Message.create({ conversation: conversationId, sender, text: safe });
  conv.last_message = { text: safe, at: msg.createdAt, sender };
  await conv.save();

  return msg.toObject();
}
