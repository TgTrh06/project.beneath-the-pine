export interface ProfileRecord { accountId: string; displayName: string | null; timezone: string; updatedAt: Date; }
export interface ProfileUpdate { displayName?: string | null; timezone?: string; }
export function validTimezone(value: string): boolean {
  try { new Intl.DateTimeFormat('en-US', { timeZone: value }); return true; } catch { return false; }
}
