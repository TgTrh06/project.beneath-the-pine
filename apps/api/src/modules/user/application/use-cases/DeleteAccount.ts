import type { UserRepository } from "../../domain/UserRepository.js";
export class DeleteAccount { public constructor(private readonly users: UserRepository) {} public async execute(userId: string): Promise<void> { await this.users.deleteUser(userId); } }
