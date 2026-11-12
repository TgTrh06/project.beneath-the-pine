// Fixed, fictional Vietnamese evaluation set; identical for both candidates.
module.exports = [
  { id: 'start-report', request: { capability: 'assisted_start', description: 'Tôi cần viết phần mục tiêu của báo cáo thực tập về ứng dụng tập trung.' } },
  { id: 'start-ui', request: { capability: 'assisted_start', description: 'Tôi muốn kiểm tra màn hình đăng nhập trên điện thoại nhưng chưa biết bắt đầu.' } },
  { id: 'start-seed', request: { capability: 'assisted_start', description: 'Tôi muốn tiếp tục phần mô tả ứng dụng từ lần trước.' }, context: { get_my_open_seed: { text: 'Lần sau viết bước đầu tiên trong luồng tạo phiên Focus.' } } },
  { id: 'recovery-large', request: { capability: 'stuck_recovery', currentStep: 'Viết toàn bộ tài liệu kiểm thử ứng dụng trong một lần.', stuckMode: 'too_large' } },
  { id: 'recovery-next', request: { capability: 'stuck_recovery', currentStep: 'Tôi đã đặt tên trang báo cáo, chưa biết viết gì tiếp.', stuckMode: 'unclear_next_step' }, context: { get_current_focus_context: { kind: 'solo', status: 'active', intention: 'Viết một đoạn về mục tiêu ứng dụng hỗ trợ tập trung.', durationMinutes: 5, endsAt: '2026-11-13T10:00:00.000Z', presence: 'active' } } },
  { id: 'recovery-distracted', request: { capability: 'stuck_recovery', currentStep: 'Tôi đang viết mô tả màn hình Focus nhưng liên tục chuyển sang tab khác.', stuckMode: 'distracted' } },
  { id: 'seed-report', request: { capability: 'open_seed_draft', context: 'Đã viết mục tiêu ứng dụng, lần sau cần bổ sung đối tượng người dùng.' } },
  { id: 'seed-test', request: { capability: 'open_seed_draft', context: 'Đã thử đăng nhập đúng, lần sau kiểm tra thông báo khi nhập sai mật khẩu.' } },
  { id: 'seed-ui', request: { capability: 'open_seed_draft', context: 'Đã xem giao diện máy tính, lần sau thử nút bắt đầu Focus ở màn hình điện thoại 320px.' } },
];
