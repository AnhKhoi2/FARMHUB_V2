import UserStreak from "../models/UserStreak.js";

// Milestones config: days -> { badge, points }
// Milestones: when user's streak reaches these days, they receive SPECIAL_POINTS
// Per new rules: daily login = 1 point; milestone days grant 5 points instead of 1.
export const MILESTONES = {
  7: { badge: "milestone_7", points: 5 },
  14: { badge: "milestone_14", points: 5 },
  30: { badge: "milestone_30", points: 5 },
  60: { badge: "milestone_60", points: 5 },
  180: { badge: "milestone_180", points: 5 },
  360: { badge: "milestone_360", points: 5 },
};

// Badge thresholds based on TOTAL points (award once when total_points reaches or exceeds)
// thresholds: 11,22,42,76,100,150,200,300,369
export const BADGE_THRESHOLDS = [
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

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Reusable login streak logic (used by controllers or other flows like auth login)
export const recordLoginHelper = async (userId) => {
  const today = startOfDay(new Date());

  let rec = await UserStreak.findOne({ user: userId });
  if (!rec) {
    // First ever login: award 1 point
    rec = new UserStreak({
      user: userId,
      current_streak: 1,
      max_streak: 1,
      last_login_date: today,
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
      badgesAwarded: [],
    };
  }

  const yesterday = startOfDay(new Date(Date.now() - 24 * 60 * 60 * 1000));
  let newStreak = 1;
  if (last && +last === +yesterday) {
    newStreak = rec.current_streak + 1;
  }

  rec.current_streak = newStreak;
  if (rec.current_streak > rec.max_streak) rec.max_streak = rec.current_streak;
  rec.last_login_date = today;

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
