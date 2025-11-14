import UserStreak from "../models/UserStreak.js";

// Milestones: award SPECIAL_POINTS on these streak days (per new rules)
const MILESTONES = {
  7: { badge: "milestone_7", points: 5 },
  14: { badge: "milestone_14", points: 5 },
  30: { badge: "milestone_30", points: 5 },
  60: { badge: "milestone_60", points: 5 },
  180: { badge: "milestone_180", points: 5 },
  360: { badge: "milestone_360", points: 5 },
};

// Badge thresholds based on TOTAL points
const BADGE_THRESHOLDS = [
  { threshold: 1, slug: "hat-giong", label: "Hạt Giống" },
  { threshold: 11, slug: "mam-non", label: "Mầm Non" },
  { threshold: 22, slug: "cay-con", label: "Cây Con" },
  { threshold: 42, slug: "re-ben", label: "Rễ Bền" },
  { threshold: 76, slug: "tan-la", label: "Tán Lá" },
  { threshold: 100, slug: "dom-nu", label: "Đơm Nụ" },
  { threshold: 150, slug: "ket-trai", label: "Kết Trái" },
  { threshold: 200, slug: "ket-trai-2", label: "Kết Trái" },
  { threshold: 300, slug: "co-thu", label: "Cổ Thụ" },
  { threshold: 369, slug: "coi-nguon", label: "Cội Nguồn" },
];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const recordLogin = async (userId) => {
  const today = startOfDay(new Date());

  let rec = await UserStreak.findOne({ user: userId });
  if (!rec) {
    // create new
    rec = new UserStreak({
      user: userId,
      current_streak: 1,
      max_streak: 1,
      last_login_date: today,
      // first login awards 1 point
      total_points: 1,
      earned_badges: [],
    });
    // check badge thresholds for initial point
    const badgesAwarded = [];
    for (const b of BADGE_THRESHOLDS) {
      if (rec.total_points >= b.threshold && !rec.earned_badges.includes(b.slug)) {
        rec.earned_badges.push(b.slug);
        badgesAwarded.push(b.slug);
      }
    }

    await rec.save();

    return {
      created: true,
      current_streak: rec.current_streak,
      max_streak: rec.max_streak,
      total_points: rec.total_points,
      earned_badges: rec.earned_badges,
      milestone: null,
      pointsAwarded: 1,
      badgesAwarded,
    };
  }

  // If last_login_date is same day -> no change
  const last = rec.last_login_date ? startOfDay(rec.last_login_date) : null;
  if (last && +last === +today) {
    return {
      created: false,
      current_streak: rec.current_streak,
      max_streak: rec.max_streak,
      total_points: rec.total_points,
      earned_badges: rec.earned_badges,
      milestone: null,
      pointsAwarded: 0,
    };
  }

  // If last was yesterday -> increment, else reset to 1
  const yesterday = startOfDay(new Date(Date.now() - 24 * 60 * 60 * 1000));
  let newStreak = 1;
  if (last && +last === +yesterday) {
    newStreak = rec.current_streak + 1;
  }

  rec.current_streak = newStreak;
  if (rec.current_streak > rec.max_streak) rec.max_streak = rec.current_streak;
  rec.last_login_date = today;

  // check milestone and award points
  const milestoneConf = MILESTONES[rec.current_streak];
  let pointsAwarded = 0;
  let milestone = null;
  if (milestoneConf) {
    // milestone day: award milestone points (5)
    rec.total_points += milestoneConf.points;
    pointsAwarded = milestoneConf.points;
    milestone = milestoneConf.badge;
  } else {
    // normal day: award 1 point
    rec.total_points += 1;
    pointsAwarded = 1;
  }

  // After updating points, check badge thresholds
  const badgesAwarded = [];
  for (const b of BADGE_THRESHOLDS) {
    if (rec.total_points >= b.threshold && !rec.earned_badges.includes(b.slug)) {
      rec.earned_badges.push(b.slug);
      badgesAwarded.push(b.slug);
    }
  }

  await rec.save();

  return {
    created: false,
    current_streak: rec.current_streak,
    max_streak: rec.max_streak,
    total_points: rec.total_points,
    earned_badges: rec.earned_badges,
    milestone,
    pointsAwarded,
    badgesAwarded,
  };
};

export const getByUser = async (userId) => {
  return UserStreak.findOne({ user: userId });
};

export const listPaginated = async ({ page = 1, limit = 20, q = "" }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const filter = {};
  // optional text search on user id or badge
  if (q) {
    // simple search on earned_badges or user string
    filter.$or = [
      { earned_badges: { $regex: q, $options: "i" } },
    ];
  }

  const items = await UserStreak.find(filter)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("user", "username email role");

  const total = await UserStreak.countDocuments(filter);

  return {
    items,
    total,
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit) || 1),
  };
};

export const topList = async ({ limit = 10, sortBy = 'total_points' } = {}) => {
  const sortField = sortBy === 'current_streak' ? { current_streak: -1 } : { total_points: -1 };
  const items = await UserStreak.find({})
    .sort(sortField)
    .limit(Number(limit))
    .populate('user', 'username email role');

  return items;
};
