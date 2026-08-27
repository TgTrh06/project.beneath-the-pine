export function currentWeekStart(timezone = "Asia/Ho_Chi_Minh", now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const localMidnight = new Date(`${value("year")}-${value("month")}-${value("day")}T00:00:00Z`);
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(value("weekday"));
  localMidnight.setUTCDate(localMidnight.getUTCDate() - Math.max(0, weekday));
  return localMidnight.toISOString().slice(0, 10);
}
