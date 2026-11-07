import { assistanceOutputSchema, type AssistanceRequest } from '@pyneath/contracts';
export const boundaryWords = /(?:tự\s*(?:tử|sát)|muốn\s+chết|suicide|kill\s+myself|chẩn\s+đoán|đơn\s+thuốc|diagnos(?:e|is)|medication)/i;
export const boundaryMessage = 'Pine không thể gợi ý công việc cho tình huống này. Hãy tìm sự hỗ trợ từ một người bạn tin cậy hoặc dịch vụ chuyên môn phù hợp.';
export const fallbackMessage = 'Chưa thể tạo gợi ý. Nội dung bạn đã nhập vẫn ở đây; bạn có thể tự viết bước tiếp theo.';
export function requestText(input: AssistanceRequest) {
  return input.capability === 'assisted_start' ? input.description : input.capability === 'stuck_recovery' ? input.currentStep : input.context;
}
export function isUnsafeSuggestion(value: string) {
  return boundaryWords.test(value) || /(?:^|\n)\s*(?:[-*•]|\d+[.)])\s+/.test(value) || value.includes('\n') || /(?:bạn đã hoàn thành|you have completed)/i.test(value);
}
export function parseLocalOutput(input: AssistanceRequest, value: unknown) {
  const output = assistanceOutputSchema.parse(value);
  if (output.capability !== input.capability) throw new Error('Capability mismatch');
  const text = output.activationStep ?? output.openSeedDraft ?? output.recoveryStep;
  if (text && isUnsafeSuggestion(text)) throw new Error('Invalid suggestion');
  return output;
}
