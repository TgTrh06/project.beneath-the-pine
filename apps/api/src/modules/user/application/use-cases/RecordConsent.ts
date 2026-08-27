import type { Consent, UserRepository } from "../../domain/UserRepository.js";
export class RecordConsent { public constructor(private readonly users: UserRepository) {} public async execute(userId: string, consent: Consent): Promise<void> { await this.users.recordConsent(userId, consent); } }
