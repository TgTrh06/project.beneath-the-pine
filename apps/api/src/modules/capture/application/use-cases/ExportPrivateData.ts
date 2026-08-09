import type { ContentCipher } from "../../../../shared/types/PrivateContent.js";
import type { CaptureRepository } from "../../domain/CapturePorts.js";
export class ExportPrivateData { public constructor(private readonly captures: CaptureRepository, private readonly cipher: ContentCipher) {} public async execute(userId: string) { return (await this.captures.exportBrainDumps(userId)).map(({ content, ...row }) => ({ ...row, content: this.cipher.decrypt(content) })); } }
