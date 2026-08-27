import type { WaitlistRepository } from "../../domain/WaitlistRepository.js";
export class JoinWaitlist { public constructor(private readonly waitlist: WaitlistRepository) {} public async execute(input: { email: string; name?: string; context?: string }): Promise<void> { await this.waitlist.join({ ...input, email: input.email.toLowerCase() }); } }
