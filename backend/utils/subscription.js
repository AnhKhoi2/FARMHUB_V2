// Lightweight date helpers (avoid external deps)
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isAfter(a, b) {
  return new Date(a).getTime() > new Date(b).getTime();
}

export const PLAN_LIMITS = {
  free: 1,
  vip: 3,
  pro: Infinity,
};

export function getEffectivePlan(user) {
  const plan = user?.subscriptionPlan || 'free';
  const exp = user?.subscriptionExpires;
  if (!exp) return plan; // free or lifetime
  const now = new Date();
  if (isAfter(now, exp)) {
    return 'free';
  }
  return plan;
}

export function getDailyLimitFor(user) {
  const plan = getEffectivePlan(user);
  return PLAN_LIMITS[plan] ?? 1;
}

export function resetOrIncrementUsage(user) {
  const today = startOfDay(new Date());
  const usageDate = user.weatherUsage?.date ? startOfDay(new Date(user.weatherUsage.date)) : null;
  if (!usageDate || usageDate.getTime() !== today.getTime()) {
    user.weatherUsage = { date: today, count: 0 };
  }
  user.weatherUsage.count = (user.weatherUsage.count || 0) + 1;
  return user.weatherUsage.count;
}

export function getTodayUsage(user) {
  const today = startOfDay(new Date());
  const usageDate = user.weatherUsage?.date ? startOfDay(new Date(user.weatherUsage.date)) : null;
  if (!usageDate || usageDate.getTime() !== today.getTime()) return 0;
  return user.weatherUsage.count || 0;
}
