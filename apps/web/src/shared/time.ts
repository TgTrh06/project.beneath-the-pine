export const deviceTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export function validTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("vi", { timeZone: value }).format();
    return Boolean(value.trim());
  } catch {
    return false;
  }
}

export function formatTime(value: string, timezone = deviceTimezone()) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

export function localToIso(value: string, timezone: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || !validTimezone(timezone)) return null;

  const [year, month, day, hour, minute] = value.split(/[-T:]/).map(Number);
  const wallUtcTimestamp = Date.UTC(year, month - 1, day, hour, minute);

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const getWallTimestamp = (timestamp: number): number => {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map((p) => [p.type, p.value]));
    return Date.UTC(
      parseInt(parts.year, 10),
      parseInt(parts.month, 10) - 1,
      parseInt(parts.day, 10),
      parseInt(parts.hour, 10),
      parseInt(parts.minute, 10)
    );
  };

  let adjustedUtc = wallUtcTimestamp;
  for (let i = 0; i < 3; i++) {
    adjustedUtc += wallUtcTimestamp - getWallTimestamp(adjustedUtc);
  }

  return getWallTimestamp(adjustedUtc) === wallUtcTimestamp ? new Date(adjustedUtc).toISOString() : null;
}

