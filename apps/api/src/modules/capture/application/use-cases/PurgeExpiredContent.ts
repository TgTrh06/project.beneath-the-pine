import type { CaptureRepository } from "../../domain/CapturePorts.js";
export class PurgeExpiredContent { public constructor(private readonly captures: CaptureRepository, private readonly now: () => Date) {} public async execute(): Promise<number> { return this.captures.purgeExpired(this.now()); } }
