export const deviceTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
export function validTimezone(value: string) { try { new Intl.DateTimeFormat("vi", { timeZone: value }).format(); return Boolean(value.trim()); } catch { return false; } }
export function formatTime(value: string, timezone = deviceTimezone()) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: timezone }).format(new Date(value)); }
export function localToIso(value: string, timezone: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || !validTimezone(timezone)) return null;
  const [y,m,d,h,min] = value.split(/[-T:]/).map(Number); const wall = Date.UTC(y,m-1,d,h,min);
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hourCycle:"h23" });
  const asWall = (stamp: number) => { const parts = Object.fromEntries(formatter.formatToParts(stamp).map(part => [part.type,part.value])); return Date.UTC(+parts.year,+parts.month-1,+parts.day,+parts.hour,+parts.minute); };
  let result = wall; for (let i=0;i<3;i++) result += wall-asWall(result);
  return asWall(result) === wall ? new Date(result).toISOString() : null;
}
