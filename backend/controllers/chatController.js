import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Expert from "../models/Expert.js";
import User from "../models/User.js";

// ===============================
// Helpers
// ===============================
const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);
const isUUID = (v) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

// Convert string -> ObjectId an toàn (BSON v6 bắt buộc dùng new)
const toObjectId = (v) =>
  v && typeof v === "string" ? new mongoose.Types.ObjectId(v) : v;

/**
 * Tìm Expert theo nhiều kiểu id:
 *  - Expert._id (ObjectId)
 *  - Expert.expert_id (UUID)
 *  - Expert.user (ObjectId của User chuyên gia)
 * Trả về doc Expert (lean) đã populate user
 */
async function resolveExpert(anyId) {
  if (!anyId) return null;

  if (isObjectId(anyId)) {
    // Có thể là _id của Expert hoặc _id của User (gắn vào field Expert.user)
    return Expert.findOne({ $or: [{ _id: anyId }, { user: anyId }] })
      .populate("user", "_id username full_name email avatar")
      .lean();
  }

  if (isUUID(anyId)) {
    return Expert.findOne({ expert_id: anyId })
      .populate("user", "_id username full_name email avatar")
      .lean();
  }

  return null;
}

function buildPairKey(u1, u2) {
  return [String(u1), String(u2)].sort().join("_");
}

// ===============================
//  OPEN: tạo/mở conversation User <-> Expert
// Body:
// - user  (role=user):   { expertId: Expert._id | expert_id(UUID) | Expert.user._id }
// - expert(role=expert): { userId: <User._id (ObjectId)> }
// ===============================
export async function open(req, res) {
  try {
    const me = req.user.id; // string của ObjectId
    const { expertId, userId } = req.body || {};

    let participants = [];
    let userRef = null;
    let expertRef = null;

    // --- Case A: user mở với expertId (ObjectId/UUID/UserId đều OK)
    if (expertId) {
      const ex = await resolveExpert(expertId);
      if (!ex?.user?._id) {
        return res.status(404).json({ error: "Expert not found" });
      }

      participants = [toObjectId(me), ex.user._id];
      userRef = toObjectId(me);
      expertRef = ex._id;
    }

    // --- Case B: expert mở với userId (bắt buộc là ObjectId thật)
    else if (userId) {
      if (!isObjectId(userId)) {
        return res
          .status(400)
          .json({ error: "Invalid userId (must be a Mongo ObjectId)" });
      }

      const exMe = await Expert.findOne({ user: toObjectId(me) }).lean();
      if (!exMe) {
        return res.status(403).json({ error: "Only expert can open with userId" });
      }

      participants = [toObjectId(me), toObjectId(userId)];
      userRef = toObjectId(userId);
      expertRef = exMe._id;
    } else {
      return res.status(400).json({ error: "Missing expertId or userId" });
    }

    const pairKey = buildPairKey(participants[0], participants[1]);

    // Tìm hoặc tạo conversation
    let conv = await Conversation.findOne({ pairKey });
    if (!conv) {
      conv = await Conversation.create({
        participants,
        user: userRef,
        expert: expertRef,
        created_by: toObjectId(me),
        pairKey,
      });
    }
    // ⭐ XÓA UNREAD khi mở chat (fix unread không mất sau reload)
const meStr = String(me);
if ((conv.unread_for || []).map(String).includes(meStr)) {
  conv.unread_for = (conv.unread_for || []).filter(u => String(u) !== meStr);
  await conv.save();
}

    

    // Populate đầy đủ cho FE (ưu tiên username > full_name)
    const populated = await Conversation.findById(conv._id)
      .populate({
        path: "user",
        model: "User",
        select: "_id username full_name email avatar",
      })
      .populate({
        path: "expert",
        model: "Expert",
        select: "_id full_name expertise_area user avatar",
        populate: { path: "user", select: "username full_name email avatar" },
      })
      .populate("last_message.sender", "username full_name email avatar")
      .lean();

    // Flatten cho FE
    if (populated?.expert?.user) {
      populated.expert_name =
        populated.expert.user.username ||
        populated.expert.user.full_name ||
        populated.expert.full_name ||
        "Chuyên gia";
      populated.expert_avatar =
        populated.expert.user.avatar || populated.expert.avatar || null;
    }
    if (populated?.user) {
      populated.user_name =
        populated.user.username ||
        populated.user.full_name ||
        populated.user.email ||
        "Người dùng";
      populated.user_avatar = populated.user.avatar || null;
    }

    return res.status(200).json({ data: populated });
  } catch (e) {
    console.error("chat.open error:", e);
    return res.status(500).json({ error: "Failed to open conversation" });
  }
}

// ===============================
//  LIST MY CONVERSATIONS
// ===============================
export async function listMy(req, res) {
  try {
    const me = req.user.id;

    const items = await Conversation.find({ participants: toObjectId(me) })
      .sort({ updatedAt: -1 })
      .populate({
        path: "user",
        model: "User",
        select: "_id username full_name email avatar",
      })
      .populate({
        path: "expert",
        model: "Expert",
        select: "_id full_name expertise_area user avatar",
        populate: { path: "user", select: "username full_name email avatar" },
      })
      .populate("last_message.sender", "username full_name email avatar")
      .lean();

    items.forEach((c) => {
      if (c?.expert?.user) {
        c.expert_name =
          c.expert.user.username ||
          c.expert.user.full_name ||
          c.expert.full_name ||
          "Chuyên gia";
        c.expert_avatar = c.expert.user.avatar || c.expert.avatar || null;
      }
      if (c?.user) {
        c.user_name =
          c.user.username || c.user.full_name || c.user.email || "Người dùng";
        c.user_avatar = c.user.avatar || null;
      }
    });

    return res.status(200).json({ data: items });
  } catch (e) {
    console.error("chat.list error:", e);
    return res.status(500).json({ error: "Failed to list conversations" });
  }
}

// ===============================
//  GET MESSAGES IN A CONVERSATION
//  Hỗ trợ before (cuộn lên) + after (lấy tin mới)
// ===============================
export async function messages(req, res) {
  try {
    const me = req.user.id;
    const { id } = req.params;
    const { before, after, limit = 20 } = req.query;

    const conv = await Conversation.findById(id);
    if (
      !conv ||
      !conv.participants.map(String).includes(String(me))
    ) {
      return res.status(403).json({ error: "Not in this conversation" });
    }

    // ✅ MARK READ: xoá mình khỏi unread_for khi load messages
    const meStr = String(me);
    const hasUnreadForMe = (conv.unread_for || []).some(
      (u) => String(u) === meStr
    );
    if (hasUnreadForMe) {
      conv.unread_for = (conv.unread_for || []).filter(
        (u) => String(u) !== meStr
      );
      await conv.save();
    }

    const filter = { conversation: toObjectId(id) };
    if (before) {
      filter.createdAt = { ...(filter.createdAt || {}), $lt: new Date(before) };
    }
    if (after) {
      filter.createdAt = { ...(filter.createdAt || {}), $gt: new Date(after) };
    }

    const sort = after ? { createdAt: 1 } : { createdAt: -1 };

    const msgs = await Message.find(filter)
      .sort(sort)
      .limit(Number(limit))
      .populate("sender", "username full_name email avatar")
      .lean();

    const nextCursor =
      !after && msgs.length ? msgs[msgs.length - 1].createdAt : null;

    const data = after ? msgs : msgs.reverse();

    return res.status(200).json({ data, meta: { nextCursor } });
  } catch (e) {
    console.error("chat.messages error:", e);
    return res.status(500).json({ error: "Failed to get messages" });
  }
}


// ===============================
//  SEND MESSAGE
// ===============================
export async function send(req, res) {
  try {
    const me = req.user.id;
    const { id } = req.params;
    const { text } = req.body || {};

    const conv = await Conversation.findById(id);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    const isMember = conv.participants.map(String).includes(String(me));
    if (!isMember) {
      return res.status(403).json({ error: "Not in this conversation" });
    }

    const safe = String(text || "").trim();
    if (!safe) {
      return res.status(400).json({ error: "Empty message" });
    }

    // Tạo message
    const msg = await Message.create({
      conversation: toObjectId(id),
      sender: toObjectId(me),
      text: safe,
    });

    // Cập nhật last_message + đánh dấu unread cho người còn lại
    const meObjId = toObjectId(me);

    // những participant KHÔNG phải mình -> họ là người nhận
    const receivers = conv.participants.filter(
      (p) => String(p) !== String(meObjId)
    );

    conv.last_message = {
      text: safe,
      at: msg.createdAt,
      sender: meObjId,
    };

    // unread_for = những người nhận (loại cả mình ra)
    conv.unread_for = receivers;

    await conv.save();

    const populatedMsg = await Message.findById(msg._id)
      .populate("sender", "username full_name email avatar")
      .lean();

    return res.status(201).json({ data: populatedMsg });
  } catch (e) {
    console.error("chat.send error:", e);
    return res.status(500).json({ error: "Failed to send message" });
  }
}

/// ===============================
//  CHECK: user đã từng chat với expert chưa
//  GET /api/chat/has-talked/:expertId
//  - expertId có thể là: Expert._id | Expert.expert_id (UUID) | Expert.user (userId của expert)
// ===============================
export async function hasTalked(req, res) {
  try {
    const me = req.user?.id || req.user?._id; // user đang đăng nhập
    const { expertId } = req.params;

    if (!me) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!expertId) {
      return res.status(400).json({ error: "Missing expertId" });
    }

    // Tìm expert (hỗ trợ nhiều kiểu id)
    const ex = await resolveExpert(expertId);
    const expertUserId = ex?.user?._id;

    // Nếu không có expert -> coi như chưa từng chat, KHÔNG ném lỗi
    if (!ex || !expertUserId) {
      return res.status(200).json({ hasTalked: false });
    }

    // Tìm conversation có cả user hiện tại + user của expert
    const hasChat = await Conversation.exists({
      participants: { $all: [toObjectId(me), toObjectId(expertUserId)] },
    });

    return res.status(200).json({
      hasTalked: !!hasChat,
    });
  } catch (e) {
    console.error("chat.hasTalked error:", e);
    // Trong trường hợp lỗi server, vẫn trả hasTalked=false để FE xử lý mềm
    return res
      .status(500)
      .json({ error: "Failed to check conversation", hasTalked: false });
  }
}
// ===============================
//  LIST CONVERSATIONS WITH UNREAD
//  GET /api/chat/unread
// ===============================
export async function listUnread(req, res) {
  try {
    // Lấy id user hiện tại theo nhiều kiểu, giống hasTalked
    let me = req.user?.id || req.user?._id;

    // Nếu middleware của bạn set req.user là Expert doc thì nó có field user
    if (!me && req.user?.user) {
      me = req.user.user; // userId gốc của chuyên gia
    }

    if (!me) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const meObjId = toObjectId(me);

    const items = await Conversation.find({
      unread_for: meObjId,
    })
      .sort({ updatedAt: -1 })
      .populate({
        path: "user",
        model: "User",
        select: "_id username full_name email avatar",
      })
      .populate({
        path: "expert",
        model: "Expert",
        select: "_id full_name expertise_area user avatar",
        populate: { path: "user", select: "username full_name email avatar" },
      })
      .lean();

    return res.status(200).json({
      data: items,
      count: items.length,
    });
  } catch (e) {
    console.error("chat.listUnread error:", e);
    return res
      .status(500)
      .json({ error: "Failed to list unread conversations" });
  }
}
