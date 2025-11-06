import UserStreak from "../models/UserStreak.js";

// Milestones config: days -> { badge, points }
export const MILESTONES = {
  7: { badge: "1_week", points: 50 },
  14: { badge: "2_weeks", points: 100 },
  30: { badge: "1_month", points: 300 },
  90: { badge: "3_months", points: 1000 },
  180: { badge: "6_months", points: 2000 },
  365: { badge: "1_year", points: 5000 },
};

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
  if (milestoneConf && !rec.earned_badges.includes(milestoneConf.badge)) {
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
