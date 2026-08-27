import type { BrainDumpAiOutput, HelpMeStartAiOutput, WeeklyReviewAiOutput } from "@beneath-the-pine/contracts";
import type { GrowthAssistant } from "../domain/CapturePorts.js";

export function crisisSafety(input: string) {
  const crisis = /tự sát|muốn chết|làm hại bản thân|không muốn sống|suicide|kill myself/i.test(input);
  return crisis
    ? { needsHumanSupport: true, message: "Bạn không cần ở một mình với điều này. Hãy liên hệ ngay người bạn tin cậy hoặc dịch vụ khẩn cấp nơi bạn đang ở." }
    : { needsHumanSupport: false };
}

/** Safe, deterministic mode used when the local model is unavailable. */
export class ManualGrowthAssistant implements GrowthAssistant {
  async extractBrainDump(content: string): Promise<BrainDumpAiOutput> {
    return { acknowledgement: "Mình đã nhận được. Ta không cần giải quyết tất cả ngay bây giờ.", candidates: [{ title: `Mở phần liên quan đến “${content.slice(0, 80)}” và viết một gạch đầu dòng`, minutes: 5 }], safety: crisisSafety(content) };
  }
  async helpStart(content: string): Promise<HelpMeStartAiOutput> {
    return { acknowledgement: "Mình sẽ làm nhỏ bước này cùng bạn.", tinyStep: `Mở phần liên quan đến “${content.slice(0, 80)}” rồi chỉ viết một dòng đầu tiên.`, options: ["Làm trong 2 phút", "Chuẩn bị không gian", "Viết một gạch đầu dòng"], minutes: 5, safety: crisisSafety(content) };
  }
  async reviewWeek(_facts: unknown): Promise<WeeklyReviewAiOutput> {
    return { summary: "Đây là một tuần có dữ liệu để quan sát, không phải để chấm điểm.", insight: "Giữ nhịp thật nhỏ ở thời điểm bạn dễ bắt đầu nhất.", experiment: { title: "Thử bắt đầu bằng 2 phút", why: "Giảm ma sát trước khi đòi hỏi hoàn thành." }, safety: { needsHumanSupport: false } };
  }
}
