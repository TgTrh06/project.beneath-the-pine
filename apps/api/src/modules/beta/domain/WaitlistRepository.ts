export type WaitlistEntry = { id: string; email: string; name: string | null; status: string; createdAt: Date };
export interface WaitlistRepository { join(input: { email: string; name?: string; context?: string }): Promise<void>; list(): Promise<WaitlistEntry[]>; findById(id: string): Promise<WaitlistEntry | null>; markApproved(id: string, approvedBy: string): Promise<WaitlistEntry>; }
