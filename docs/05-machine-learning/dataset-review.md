# Review dữ liệu Pyneath v2

Quy trình được duyệt ngày 2026-11-09. Dữ liệu và quyết định thật nằm trong `ml/data/private/`; chỉ tài liệu, công cụ và thống kê tổng hợp được commit. Người dùng sẽ review tiếng Việt; mã reviewer chưa được cung cấp. Chưa có người viết holdout độc lập.

## Bắt đầu với lô hiệu chỉnh

Đọc `ml/data/private/pyneath-assistance-vi-v2-review/calibration-90.md` và ghi quyết định trong `calibration-90.json`. Phiếu có 30 mẫu mỗi capability: 20 ordinary, 5 safety_boundary, 5 challenge. Đây là 80 mẫu draft được biên tập bằng assistant và 10 ứng viên recovery bổ sung; chưa có mẫu được con người duyệt. Các mốc thời gian/editor trong lịch sử biên tập không phải bằng chứng reviewer.

Có thể bắt đầu bằng `start-here-9.md` và `start-here-9.json`: chín mẫu lấy từ lô 90, một mẫu mỗi cặp capability/category. Đây không phải lô được tính thêm. Sau khi nhập quyết định cho chín mẫu, tạo lại phiếu cho phần còn pending của `calibration-ids.json` trên snapshot mới.

Snapshot hiện tại: `ml/data/private/pyneath-assistance-vi-v2-review/round-001/`. Không sửa trực tiếp file trong snapshot. `round-000` và các phiếu `calibration-initial` chỉ là lịch sử trước biên tập.

`calibration-ids.json` cố định danh sách lô 90. Sau khi nhập một phần, dùng `form --selection PRIVATE/calibration-ids.json` trên snapshot mới để lấy đúng các mẫu còn pending của lô; không chạy lại `--calibration` vì thao tác đó chọn một lô cân bằng mới. Có thể thêm `--limit 9` để review từng lượt nhỏ.

Reviewer có thể làm từng phần rồi gửi lại file hoặc nêu quyết định theo ID trong cuộc trao đổi. Việc agent ghi quyết định thay chỉ được thực hiện từ đánh giá và xác nhận thực tế mà reviewer cung cấp; không suy diễn điểm số, danh tính, thời điểm hay quyền sử dụng từ việc đồng ý kế hoạch.

## Rubric

Với suggestion, chấm năm tiêu chí từ 0 đến 2:

| Trường | 0 — không đạt | 1 — dùng được nhưng còn hạn chế | 2 — đạt rõ |
| --- | --- | --- | --- |
| relevance | Sai điểm vướng/ràng buộc | Liên quan nhưng chưa sát | Đúng nhu cầu và ràng buộc đầu vào |
| specificity | Động viên chung chung | Có hành động nhưng còn mơ hồ | Một thao tác rõ ràng |
| feasibility | Việc lớn hoặc nhiều bước ngầm | Làm được nhưng còn ma sát | Bước nhỏ có thể bắt đầu với điều kiện đã nêu |
| no_invention | Bịa dữ liệu, tiến độ hoặc công cụ | Có giả định nhẹ cần sửa | Không thêm thông tin chưa được cung cấp |
| vietnamese_tone | Khó hiểu/phán xét/gây áp lực | Hiểu được nhưng hơi khuôn mẫu | Tiếng Việt tự nhiên, rõ, tôn trọng |

Duyệt khi tổng ít nhất 8/10 và không tiêu chí nào bằng 0. Nếu một giả định ảnh hưởng đến tính đúng của gợi ý, phải sửa; điểm tổng không bù lỗi policy. Với boundary/fallback, giữ các điểm này `null` và đánh giá nhãn, thông báo cố định cùng các điều kiện bắt buộc.

Các trường `checks` đều phải được reviewer xác nhận `true` khi approve:

- `contract`: request/output đúng capability, schema, giới hạn và định dạng.
- `policy`: suggestion/fallback/boundary đúng nghĩa trong tình huống; không dựa vào từ khóa đơn lẻ.
- `product_behavior`: chỉ đề xuất; không hứa đã lưu, gửi, hoàn thành hoặc tự đổi timer/presence.
- `provenance`: tình huống giả lập thuộc nguồn cho phép; mẫu tái sử dụng đã được biên tập thực chất và ghi lại nguồn.

`expected_status` là đánh giá riêng của reviewer và phải khớp nhãn mẫu khi duyệt. Nhãn `challenge` không có nghĩa là phải từ chối. Thiếu thông tin có thể cần fallback. Ít năng lượng không đồng nghĩa khủng hoảng. Nội dung trích dẫn trong truyện phải được xét theo ngữ cảnh. Nếu policy chưa rõ, chọn `escalate`; không tự sửa protocol để mẫu chạy qua.

## Ghi quyết định

Chỉ sửa các trường quyết định trong phiếu JSON, không sửa `display`, ID hoặc hash:

- `decision`: `approve`, `revise`, `reject`, `escalate`; giữ `null` với mẫu chưa review.
- `reviewer_id`: mã do reviewer tự chọn; không cần thông tin cá nhân.
- `reviewed_at`: thời điểm review thực tế theo ISO-8601 có múi giờ, ví dụ định dạng `YYYY-MM-DDTHH:MM:SS+07:00`.
- `reason`: lý do ngắn, cụ thể; với revise/escalate nêu vấn đề phải giải quyết.
- `expected_status`, `scores`, `checks`: theo rubric trên.
- `owner_approval`: chỉ điền khi có quyền sử dụng thật. Object gồm `owner_id`, `approved_at`, `content_sha256` của mẫu và `permission: "private-training-and-evaluation"`. Cùng một người có thể là reviewer và chủ sở hữu nhưng phải xác nhận cả hai vai trò. Không cho phép phát hành công khai qua xác nhận này.
- `independent_authorship`: `null` cho development. Với test cần author ID, thời điểm, hash, mô tả phương pháp và xác nhận `no_development_rows_seen: true`, `not_model_output: true` từ tác giả thật.

Các file JSON là bằng chứng tự khai có hash để phát hiện sai phiên bản, không phải chữ ký số hoặc cơ chế xác thực danh tính. Agent không thể xác minh quyền sở hữu pháp lý chỉ từ chuỗi owner ID. Review thật vẫn bắt buộc.

## CLI và phiên bản làm việc

Chạy từ repo root. Mỗi `--output` phải là đường dẫn mới; không ghi đè snapshot, phiếu hoặc handoff cũ. Lệnh chỉ ghi dữ liệu local, không gọi model/HTTP. Ngoại lệ `tokens` tải tokenizer **từ cache local**, không tải weights, không dùng GPU và không truy cập mạng. Nếu thiếu cache/dependency, dừng để chuẩn bị môi trường riêng; không tự cài hoặc tải model.

```sh
# Tạo snapshot từ các file candidate; approval cũ không được tự nhập lại.
python ml/scripts/review_dataset.py prepare --sources PRIVATE/train.jsonl PRIVATE/validation.jsonl --output PRIVATE/round-000

# Lô đầu cần đủ coverage; nếu thiếu nhóm thì lệnh báo lỗi.
python ml/scripts/review_dataset.py form --workspace PRIVATE/round-000 --calibration --output PRIVATE/calibration.json

# Hoặc lô thường tối đa 150 mẫu, luân phiên ba capability.
python ml/scripts/review_dataset.py form --workspace PRIVATE/round-000 --limit 150 --output PRIVATE/batch-01.json

# Nhập các quyết định đã điền; ô null vẫn pending.
python ml/scripts/review_dataset.py apply --workspace PRIVATE/round-000 --form PRIVATE/batch-01.json --output PRIVATE/round-001

# Xuất phiếu mới từ snapshot mới trước lần nhập tiếp theo.
python ml/scripts/review_dataset.py form --workspace PRIVATE/round-001 --limit 150 --output PRIVATE/batch-02.json

python ml/scripts/review_dataset.py audit --workspace PRIVATE/round-001 --output PRIVATE/audit-001.json
python ml/scripts/review_dataset.py tokens --workspace PRIVATE/round-001 --output PRIVATE/tokens-001.json
```

Phiếu có companion Markdown cùng tên để đọc. Phiếu đang mở gắn với một snapshot; sau mỗi lần apply/revise, phiếu cũ không còn dùng cho snapshot mới. Review dở được giữ trong snapshot và lịch sử. Với một reviewer, chốt lô 90 trước khi mở rộng; không báo đã có kiểm chứng độc lập giữa hai reviewer.

### Sửa mẫu

Tạo file edits gồm `snapshot_id` và danh sách `edits`. Mỗi edit có `scenario_id`, `content_sha256` trước sửa, `editor_id`, `edited_at`, `reason`, `changes` (mapping trường cần thay). Khi sửa request/output, thay toàn bộ trường `messages` gồm system/user/assistant; system prompt phải giữ nguyên. Không sửa ID, version hoặc trường approval.

```sh
python ml/scripts/review_dataset.py revise --workspace PRIVATE/round-001 --edits PRIVATE/edits-001.json --output PRIVATE/round-002
```

Sửa nhãn, nguồn, nhóm, split hoặc nội dung đều làm mất approval và yêu cầu review lại. Mẫu `synthetic_draft_rewritten` phải có lịch sử sửa nội dung messages trước khi được duyệt trong quy trình này. Công cụ xác nhận có sửa nội dung; reviewer quyết định việc sửa đã thực chất hay chỉ thay từ. Mẫu bị reject được giữ trong lịch sử; dùng selection để loại khỏi tập cuối. Không tái dùng ID cũ cho tình huống không liên quan.

### Ghép và chọn tập cuối

`combine` ghép các snapshot không trùng ID và giữ lịch sử. `--selection` nhận một JSON array ID để chọn tập cuối; không thay split hay nội dung đã duyệt. Không dùng `prepare` để nhập lại tập đã review vì lệnh đó chủ động xóa approval.

```sh
python ml/scripts/review_dataset.py combine --workspaces PRIVATE/development-final PRIVATE/holdout-final --selection PRIVATE/selected-ids.json --output PRIVATE/selected
```

Chia nhóm trước biến thể; giữ seed `20261029`. Nếu cần đổi split hoặc group, làm trước review cuối qua `revise`; không tách các biến thể để ép đúng tỷ lệ 80/20. Một nhóm ngữ nghĩa dùng lại ở nhiều capability vẫn phải cùng split. Đảm bảo tối thiểu 350 train và 75 validation mỗi capability. Mục tiêu khoảng 100 nhóm/capability, thường không quá năm biến thể; báo cáo nhóm lớn là yêu cầu biên tập, không có nghĩa thêm ID mới sẽ tạo được đa dạng thật.

## Coverage và trùng dữ liệu

Development mục tiêu mỗi capability: 350 ordinary, 75 boundary, 75 challenge (500). Holdout: 70/15/15 (100). Mẫu vượt quota vẫn là candidate, chưa được tự chọn vào tập cuối. Audit báo counts theo split/capability/category, domain, difficulty, mode/action recovery, số nhóm và nhóm lớn hơn năm mẫu. Mỗi split cần đủ bốn recovery mode và ba action; đây là kiểm tra có mặt, không ép mỗi mode phải chọn một action cố định.

Audit kiểm tra toàn bộ cặp đầu vào đã chuẩn hóa, gồm trong cùng split và giữa các capability. Nó báo normalized exact hoặc Jaccard >= 0.85, không dùng embeddings và không bảo đảm hết trùng ngữ nghĩa. Kết quả khác báo cáo lexical cũ vì không đưa key JSON/capability vào tập từ. Cặp bị chặn bởi validator (trùng cùng capability hoặc nhóm giao nhau) phải sửa, không thể ký bỏ qua.

Reviewer đọc cả nhóm và phương án gợi ý để phát hiện template chỉ thay danh từ. Cặp gần trùng khác nghĩa có thể giữ khi có lý do. Nếu cùng tình huống, loại biến thể hoặc đặt cùng nhóm/split rồi review lại. Cặp normalized exact giữa các split bị chặn cả khi khác capability. Không chỉ dựa vào việc script báo không có cặp.

Audit chứa `human_evidence_template`: điền danh tính/thời điểm thật, `semantic_overlap_review: "approved"`, quyết định cho mọi `pair_id` hiện tại và lý do. Chỉ dùng `distinct_scenarios_or_same_split_family` khi thực sự giữ được vì khác tình huống hoặc cùng family trong cùng split. Các cặp đã sửa phải audit lại; hash quyết định cũ không chuyển sang phiên bản mới.

## Bàn giao, chưa freeze

Khi đủ 1.800 mẫu được duyệt, chạy Python/Zod, token check và xử lý trùng trên snapshot cuối. `export` yêu cầu coverage đúng, không còn pending/rejected, review/owner evidence của từng dòng, authorship của holdout, dataset-level overlap review và token report khớp snapshot/hash/model revision. File `test.jsonl` chỉ dành cho đánh giá; enum `usage=training-approved` kế thừa schema v2 không cho phép đưa test vào train.

```sh
python ml/scripts/review_dataset.py export --workspace PRIVATE/selected --evidence PRIVATE/overlap-evidence.json --token-report PRIVATE/tokens-selected.json --output PRIVATE/handoff
```

Handoff gồm train/validation/test, lịch sử, nguồn, bằng chứng review/token và checksum. Trạng thái là `reviewed-awaiting-freeze`, không tạo `manifest.json` training. Bước 2 tạo chữ ký xác nhận cấp dataset (reviewer evidence theo giao thức freeze hiện có), đóng băng manifest và kiểm tra lại checksum. Không dùng handoff report thay cho freeze manifest. Mọi thay đổi nội dung sau đó cần review và phiên bản mới.

Không train, upload private data, bật provider hoặc phát hành model trong bước hoàn thiện dữ liệu.
