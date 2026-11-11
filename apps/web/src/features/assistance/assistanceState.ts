import type { AssistanceCapability, AssistanceConfig, AssistanceRequest, AssistanceResponse, StuckMode } from '@pyneath/contracts';

export const assistanceLabels = {
  assisted_start: 'Gợi ý một bước 3–10 phút', open_seed_draft: 'Gợi ý câu quay lại', stuck_recovery: 'Gợi ý cách tiếp tục'
};
export function makeAssistanceRequest(capability: AssistanceCapability, value: string, stuckMode: StuckMode): AssistanceRequest {
  const text = value.trim();
  return capability === 'assisted_start' ? { capability, description: text }
    : capability === 'open_seed_draft' ? { capability, context: text }
    : { capability, currentStep: text, stuckMode };
}
export function assistanceDisclosure(processing: AssistanceConfig['processing'], provider?: string) {
  if (provider === 'openrouter') return 'AI có thể gợi ý chưa phù hợp. Nội dung bạn gửi và ngữ cảnh bạn chọn được chuyển qua OpenRouter tới nhà cung cấp chạy DeepSeek để tạo gợi ý. Hãy kiểm tra và sửa trước khi dùng; không gửi thông tin nhạy cảm.';
  if (provider === 'gemini') return 'Bản demo: chỉ nhập dữ liệu giả. Nội dung bạn gửi và ngữ cảnh bạn chọn có thể được chuyển tới Google Gemini. Với API free tier, Google có thể dùng đầu vào và phản hồi để cải thiện sản phẩm. Không gửi thông tin riêng tư hoặc nhạy cảm.';
  return processing === 'self_hosted'
    ? 'Bản demo: chỉ nhập dữ liệu giả. Nội dung vừa nhập được gửi đến máy chủ Pyneath để tạo gợi ý.'
    : 'Bản demo: chỉ nhập dữ liệu giả. Nội dung vừa nhập được gửi tới dịch vụ AI bên ngoài để tạo gợi ý. Không gửi thông tin riêng tư hoặc nhạy cảm.';
}

export interface AssistanceState {
  result: AssistanceResponse | null;
  resultRevision: number;
  draft: string;
  pending: boolean;
  error: string;
}
export const initialAssistanceState: AssistanceState = { result: null, resultRevision: -1, draft: '', pending: false, error: '' };
export type AssistanceAction =
  | { type: 'request' }
  | { type: 'response'; response: AssistanceResponse; sentRevision: number; currentRevision: number }
  | { type: 'failure'; sentRevision: number; currentRevision: number }
  | { type: 'settled' }
  | { type: 'edit'; draft: string }
  | { type: 'dismiss' }
  | { type: 'choose' };

export function visibleAssistanceResult(state: AssistanceState, revision: number) {
  return state.resultRevision === revision ? state.result : null;
}
export function assistanceReducer(state: AssistanceState, action: AssistanceAction): AssistanceState {
  switch (action.type) {
    case 'request': return { ...state, pending: true, error: '', result: null };
    case 'response': {
      if (action.sentRevision !== action.currentRevision) return state;
      const { response } = action;
      const draft = response.status === 'suggestion'
        ? response.output.activationStep ?? response.output.openSeedDraft ?? response.output.recoveryStep ?? '' : state.draft;
      return { ...state, result: response, resultRevision: action.sentRevision, draft };
    }
    case 'failure': return action.sentRevision !== action.currentRevision ? state : { ...state,
      error: 'Chưa thể tạo gợi ý. Nội dung bạn đã nhập vẫn ở đây; hãy thử lại hoặc tự viết tiếp.' };
    case 'settled': return { ...state, pending: false };
    case 'edit': return { ...state, draft: action.draft };
    case 'dismiss': return { ...state, result: null, draft: '' };
    case 'choose': return { ...state, result: null };
  }
}
