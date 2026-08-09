import OpenAI from "openai";
import { brainDumpAiSchema, helpMeStartAiSchema, weeklyReviewAiSchema, type BrainDumpAiOutput, type HelpMeStartAiOutput, type WeeklyReviewAiOutput } from "@beneath-the-pine/contracts";
import { env } from "../../../env.js";
import type { GrowthAssistant } from "../domain/CapturePorts.js";

const crisisPattern = /tự sát|muốn chết|làm hại bản thân|không muốn sống|suicide|kill myself/i;
const safety = (input: string) => crisisPattern.test(input) ? { needsHumanSupport: true, message: "Bạn không cần ở một mình với điều này. Hãy liên hệ ngay người bạn tin cậy hoặc dịch vụ khẩn cấp nơi bạn đang ở." } : { needsHumanSupport: false };

export class OpenAiGrowthAssistant implements GrowthAssistant {
  private readonly client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
  public async extractBrainDump(content: string): Promise<BrainDumpAiOutput> { const local = { acknowledgement: "Mình đã nhận được. Ta không cần giải quyết tất cả ngay bây giờ.", candidates: [{ title: `Mở phần liên quan đến “${content.slice(0, 80)}” và viết một gạch đầu dòng`, minutes: 5 }], safety: safety(content) }; return this.generate(content, brainDumpAiSchema, "brain_dump", local); }
  public async helpStart(content: string): Promise<HelpMeStartAiOutput> { const local = { acknowledgement: "Mình sẽ làm nhỏ bước này cùng bạn.", tinyStep: "Mở tài liệu hoặc vật dụng cần thiết, rồi chỉ làm một dòng đầu tiên.", options: ["Làm 2 phút", "Chuẩn bị không gian", "Viết gạch đầu dòng"], minutes: 5, safety: safety(content) }; return this.generate(content, helpMeStartAiSchema, "help_me_start", local); }
  public async reviewWeek(facts: unknown): Promise<WeeklyReviewAiOutput> { const input = JSON.stringify(facts); const local = { summary: "Đây là một tuần có dữ liệu để quan sát, không phải để chấm điểm.", insight: "Hãy giữ nhịp thật nhỏ ở thời điểm bạn dễ bắt đầu nhất.", experiment: { title: "Thử bắt đầu bằng 2 phút", why: "Giảm ma sát trước khi đòi hỏi hoàn thành." }, safety: safety(input) }; return this.generate(input, weeklyReviewAiSchema, "weekly_review", local); }
  private async generate<T>(input: string, schema: { parse(value: unknown): T }, kind: "brain_dump" | "help_me_start" | "weekly_review", fallback: T): Promise<T> { if (!this.client || (fallback as { safety?: { needsHumanSupport?: boolean } }).safety?.needsHumanSupport) return fallback; const response = await this.client.responses.create({ model: env.OPENAI_MODEL, instructions: "You are a gentle Vietnamese executive-function companion. Never diagnose, shame, or claim certainty. Return only data that satisfies the supplied JSON Schema.", input, text: { format: { type: "json_schema", name: `${kind}_output`, strict: true, schema: schemaFor(kind) } } }); return schema.parse(JSON.parse(response.output_text)); }
}

const safetySchema = { type: "object", additionalProperties: false, required: ["needsHumanSupport"], properties: { needsHumanSupport: { type: "boolean" }, message: { type: "string" } } };
function schemaFor(kind: "brain_dump" | "help_me_start" | "weekly_review") {
  if (kind === "brain_dump") return { type: "object", additionalProperties: false, required: ["acknowledgement", "candidates", "safety"], properties: { acknowledgement: { type: "string" }, candidates: { type: "array", minItems: 1, maxItems: 4, items: { type: "object", additionalProperties: false, required: ["title", "minutes"], properties: { title: { type: "string" }, minutes: { type: "integer", minimum: 1, maximum: 10 } } } }, safety: safetySchema } };
  if (kind === "help_me_start") return { type: "object", additionalProperties: false, required: ["acknowledgement", "tinyStep", "options", "minutes", "safety"], properties: { acknowledgement: { type: "string" }, tinyStep: { type: "string" }, options: { type: "array", maxItems: 3, items: { type: "string" } }, minutes: { type: "integer", minimum: 1, maximum: 10 }, safety: safetySchema } };
  return { type: "object", additionalProperties: false, required: ["summary", "insight", "experiment", "safety"], properties: { summary: { type: "string" }, insight: { type: "string" }, experiment: { type: "object", additionalProperties: false, required: ["title", "why"], properties: { title: { type: "string" }, why: { type: "string" } } }, safety: safetySchema } };
}
