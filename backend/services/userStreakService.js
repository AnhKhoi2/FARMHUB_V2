import UserStreak from "../models/UserStreak.js";

// Milestones config: days -> { badge, points }
const MILESTONES = {
  7: { badge: "1_week", points: 50 },
  14: { badge: "2_weeks", points: 100 },
  30: { badge: "1_month", points: 300 },
  90: { badge: "3_months", points: 1000 },
  180: { badge: "6_months", points: 2000 },
  365: { badge: "1_year", points: 5000 },
};

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
      total_points: 0,
      earned_badges: [],
    });
    await rec.save();

    return {
      created: true,
      current_streak: rec.current_streak,
      max_streak: rec.max_streak,
      total_points: rec.total_points,
      earned_badges: rec.earned_badges,
      milestone: null,
      pointsAwarded: 0,
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

  // check milestone
  const milestoneConf = MILESTONES[rec.current_streak];
  let pointsAwarded = 0;
  let milestone = null;
  if (milestoneConf && !rec.earned_badges.includes(milestoneConf.badge)) {
    // award
    rec.total_points += milestoneConf.points;
    pointsAwarded = milestoneConf.points;
    rec.earned_badges.push(milestoneConf.badge);
    milestone = milestoneConf.badge;
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
