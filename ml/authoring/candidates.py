"""Build review candidates, never training-ready rows or a fabricated independent holdout."""
import copy
import hashlib
import json
import random
from pathlib import Path
from ml.common.protocol import CAPABILITIES, protocol
from ml.common.files import read_rows, sha256, write_new

RECIPES = [
 ('study', 'ôn bài lịch sử', 'Mở vở và khoanh một mốc thời gian cần nhớ.'),
 ('study', 'học từ vựng', 'Chọn một từ và đặt một câu ngắn với từ đó.'),
 ('study', 'đọc bài nghiên cứu', 'Đọc tiêu đề và viết một câu hỏi muốn tìm lời giải.'),
 ('study', 'làm bài toán', 'Chép riêng dữ kiện và điều cần tìm của một bài.'),
 ('study', 'chuẩn bị thuyết trình', 'Viết một câu về điều người nghe cần nhớ.'),
 ('study', 'ôn địa lý', 'Mở bản đồ và tìm một địa danh đang học.'),
 ('study', 'học ngữ pháp', 'Viết một câu dùng cấu trúc đang học.'),
 ('study', 'đọc chương sách', 'Đọc một đoạn và ghi một ý bằng lời của mình.'),
 ('study', 'làm báo cáo thí nghiệm', 'Ghi tên phép đo và đơn vị vào một dòng trống.'),
 ('study', 'luyện nghe', 'Nghe một câu ngắn rồi ghi những từ nhận ra.'),
 ('writing', 'viết email', 'Viết một câu nêu điều bạn muốn người nhận biết.'),
 ('writing', 'viết mở bài', 'Ghi một ví dụ cụ thể liên quan đến chủ đề.'),
 ('writing', 'sửa bản thảo', 'Đọc một đoạn và đánh dấu một câu khó hiểu.'),
 ('writing', 'viết ghi chú', 'Ghi một ý còn nhớ, chưa cần sắp xếp.'),
 ('writing', 'làm dàn ý', 'Viết tên một mục bạn đã biết muốn nói đến.'),
 ('writing', 'viết mô tả sản phẩm', 'Ghi một việc sản phẩm giúp người dùng làm.'),
 ('writing', 'soạn câu hỏi phỏng vấn', 'Viết một câu hỏi về một trải nghiệm cụ thể.'),
 ('writing', 'viết hướng dẫn', 'Viết thao tác đầu tiên người đọc cần làm.'),
 ('writing', 'rút gọn đoạn văn', 'Đánh dấu một câu đang lặp ý trong đoạn.'),
 ('writing', 'đặt tiêu đề', 'Viết một tiêu đề mô tả trực tiếp nội dung.'),
 ('code', 'sửa lỗi giao diện', 'Mở màn hình lỗi và ghi một bước tái hiện.'),
 ('code', 'viết unit test', 'Ghi một đầu vào và kết quả mong đợi.'),
 ('code', 'đọc code cũ', 'Tìm điểm gọi của một hàm đang cần hiểu.'),
 ('code', 'sửa lỗi API', 'Xem mã trạng thái của một yêu cầu thất bại.'),
 ('code', 'viết hàm xử lý', 'Viết một ví dụ đầu vào và đầu ra của hàm.'),
 ('code', 'đọc lỗi build', 'Đọc dòng lỗi đầu tiên và ghi tên file liên quan.'),
 ('code', 'review thay đổi', 'Mở một file thay đổi và đọc phần mô tả của nó.'),
 ('code', 'cập nhật tài liệu kỹ thuật', 'Đánh dấu một câu không còn đúng với code.'),
 ('code', 'sửa truy vấn', 'Ghi tên bảng và một trường cần lấy.'),
 ('code', 'tìm lỗi cấu hình', 'Ghi tên biến cấu hình đang thiếu, không chép giá trị bí mật.'),
 ('design', 'phác thảo màn hình', 'Vẽ một khung và ghi hành động chính của màn hình.'),
 ('design', 'chọn kiểu chữ', 'Viết một tiêu đề mẫu bằng kiểu chữ đang dùng.'),
 ('design', 'sửa bố cục', 'Đánh dấu phần nội dung cần được đọc trước.'),
 ('design', 'thiết kế biểu mẫu', 'Viết nhãn cho một trường bắt buộc.'),
 ('design', 'chọn màu giao diện', 'Ghi vai trò của một màu đang cần chọn.'),
 ('design', 'vẽ biểu tượng', 'Phác một hình đơn giản diễn tả hành động chính.'),
 ('design', 'kiểm tra giao diện nhỏ', 'Mở một màn hình hẹp và đánh dấu chỗ tràn đầu tiên.'),
 ('design', 'soạn nội dung nút', 'Viết một động từ mô tả đúng hành động của nút.'),
 ('design', 'sắp xếp ảnh', 'Chọn một ảnh liên quan nhất đến nội dung chính.'),
 ('design', 'ghi nhận phản hồi', 'Ghi một nhận xét cụ thể mà bạn đã nhận được.'),
 ('home', 'dọn bàn', 'Cất một món đồ không dùng khỏi mặt bàn.'),
 ('home', 'sắp xếp giấy tờ', 'Chọn một tờ và đặt vào nhóm giấy liên quan.'),
 ('home', 'chuẩn bị bữa ăn', 'Đặt một nguyên liệu cần dùng lên bàn bếp.'),
 ('home', 'sắp xếp tủ sách', 'Chọn một cuốn và đặt lại đúng chỗ.'),
 ('home', 'chuẩn bị đồ đi học', 'Đặt một món cần dùng vào túi.'),
 ('home', 'ghi danh sách mua đồ', 'Ghi một món đang thiếu trong nhà.'),
 ('home', 'sắp xếp ảnh gia đình', 'Chọn một thư mục và đặt tên theo dịp chụp.'),
 ('home', 'chăm cây', 'Quan sát đất của một chậu trước khi quyết định tưới.'),
 ('home', 'dọn thư mục máy tính', 'Chọn một file và đổi tên để dễ nhận ra nội dung.'),
 ('home', 'chuẩn bị góc làm việc', 'Đặt tài liệu cần dùng trước mặt.'),
]
VARIANTS = [
 ('too_large', 'Mình thấy việc này quá lớn.'), ('too_large', 'Mình muốn làm nhỏ phần trước mắt.'),
 ('unclear_next_step', 'Mình chưa biết bắt đầu lại từ đâu.'), ('unclear_next_step', 'Mình đang phân vân bước tiếp theo.'),
 ('distracted', 'Mình vừa bị ngắt quãng.'), ('distracted', 'Mình cứ chuyển sang việc khác.'),
 ('low_energy', 'Mình chỉ muốn làm một việc nhẹ.'), ('low_energy', 'Mình muốn nghỉ ngắn rồi quay lại.'),
 ('too_large', 'Mình sợ chưa làm được hoàn hảo.'), ('unclear_next_step', 'Mình muốn thử một cách đơn giản hơn.')
]


def draft(row):
    row.update(dataset_version='pyneath-assistance-vi-v2', review_status='pending_review', reviewer_id=None, reviewed_at=None,
               provenance_class='synthetic_draft_rewritten', provenance_stage='unreviewed_synthetic_draft', license_status='private_owner_release_decision_pending', usage='draft/local-only', independent_holdout=False)
    row['messages'][0]['content'] = protocol()['system_prompt']
    return row


def generate(source, directory):
    directory = Path(directory)
    if directory.exists():
        raise ValueError('Refusing to overwrite candidates')
    selected = {cap: [] for cap in CAPABILITIES[:2]}
    rng = random.Random(20261029)
    rows = list(read_rows(source)); rng.shuffle(rows)
    for row in rows:
        cap = row['capability']
        if cap in selected and len(selected[cap]) < 500:
            candidate = draft(copy.deepcopy(row))
            if candidate['category'] in CAPABILITIES:
                candidate['category'] = 'ordinary'
            candidate['source_dataset_sha256'] = sha256(source) if not selected[cap] else selected[cap][0]['source_dataset_sha256']
            candidate['scenario_id'] = 'v2-' + row['scenario_id']
            selected[cap].append(candidate)
    if any(len(group) != 500 for group in selected.values()):
        raise ValueError('Need at least 500 v1 candidates for each original capability')
    candidates = sum(selected.values(), [])
    for i, (domain, task, step) in enumerate(RECIPES):
        for j, (mode, context) in enumerate(VARIANTS):
            request = {'capability': 'stuck_recovery', 'currentStep': f'Tôi đang {task}. {context}', 'stuckMode': mode}
            output = {'capability': 'stuck_recovery', 'version': '1', 'needsHumanSupport': False, 'fallback': 'manual_step', 'recoveryAction': 'different_approach' if mode == 'unclear_next_step' else 'smaller_step', 'recoveryStep': step}
            if j == 7:
                output = {'capability': 'stuck_recovery', 'version': '1', 'needsHumanSupport': False, 'fallback': 'take_break', 'recoveryAction': 'take_break', 'breakMinutes': 2}
            row = {'scenario_id': f'v2-recovery-{i:02}-{j:02}', 'scenario_group_id': f'recovery-{i:02}', 'split_group_id': f'recovery-{i:02}',
                   'capability': 'stuck_recovery', 'domain': domain, 'category': 'ordinary', 'difficulty': 'moderate', 'safety_tags': [], 'source_utterance_used': False, 'expected_status': 'suggestion',
                   'messages': [{'role': 'system', 'content': protocol()['system_prompt']}, {'role': 'user', 'content': json.dumps(request, ensure_ascii=False)}, {'role': 'assistant', 'content': json.dumps(output, ensure_ascii=False)}]}
            candidates.append(draft(row))
    groups = sorted({row['split_group_id'] for row in candidates})
    rng.shuffle(groups)
    validation = set(groups[:round(len(groups) * .2)])
    directory.mkdir(parents=True)
    for row in candidates:
        row['split'] = 'validation' if row['split_group_id'] in validation else 'train'
    for split in ('train', 'validation'):
        with (directory / f'{split}.jsonl').open('x', encoding='utf-8') as stream:
            for row in candidates:
                if row['split'] == split:
                    stream.write(json.dumps(row, ensure_ascii=False) + '\n')
    write_new(directory / 'review-queue.json', {'status': 'pending-human-review', 'rows': len(candidates), 'approved_rows': 0, 'limitations': ['Recovery candidates are only 50 task families expanded into 500 rows.', 'Recovery safety/adversarial examples still need authoring.', 'Development balance and semantic overlap require review.'], 'source_sha256': sha256(source)})
    write_new(directory / 'holdout-authoring-brief.json', {'status': 'not-authored', 'independent_author_required': True, 'per_capability': {'ordinary': 70, 'safety_boundary': 15, 'challenge': 15}, 'capabilities': list(CAPABILITIES), 'instructions': 'Write new scenarios without viewing development rows; use canonical request/output contracts. Do not turn these instructions into claimed completed examples.'})
    return {'draft_rows': len(candidates), 'approved_rows': 0, 'holdout_rows': 0}
