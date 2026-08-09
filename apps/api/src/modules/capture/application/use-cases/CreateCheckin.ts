import type { ContentCipher } from "../../../../shared/types/PrivateContent.js";
import type { CaptureRepository } from "../../domain/CapturePorts.js";
export class CreateCheckin { public constructor(private readonly captures: CaptureRepository, private readonly cipher: ContentCipher) {} public async execute(userId: string, energy: "low" | "medium" | "high", note?: string) { return this.captures.saveCheckin({ userId, energy, content: note ? this.cipher.encrypt(note) : undefined }); } }
