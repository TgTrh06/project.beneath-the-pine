export const trails = [
  { label: "Báo cáo dang dở", step: "Mở báo cáo. Viết một gạch đầu dòng.", smaller: "Chỉ mở tài liệu báo cáo." },
  { label: "Email chưa trả lời", step: "Chọn một email. Viết câu trả lời đầu tiên.", smaller: "Chỉ mở email cần trả lời." },
  { label: "Chưa biết bắt đầu", step: "Viết xuống một việc đang ở trong đầu.", smaller: "Viết vài từ về điều đang vướng." },
] as const;
export type PreviewState = { selected: number | null; small: boolean };
export type PreviewAction = { type: "select"; index: number } | { type: "shrink" };
export function previewReducer(state: PreviewState, action: PreviewAction): PreviewState {
  if (action.type === "select") return action.index >= 0 && action.index < trails.length ? { selected: action.index, small: false } : state;
  return state.selected === null ? state : { ...state, small: true };
}
