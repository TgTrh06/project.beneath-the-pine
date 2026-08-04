# Definition of Done

Một story chỉ được xem là hoàn thành khi:

- Acceptance criteria đã được đáp ứng.
- Code review hoàn tất.
- Typecheck, lint và automated tests pass.
- Có test cho logic quan trọng và regression phù hợp.
- Loading, empty, error và timeout state được xử lý.
- Keyboard/focus/accessibility được kiểm tra.
- Không log dữ liệu nhạy cảm ngoài thiết kế.
- Analytics event đúng schema, không chứa raw content.
- API/documentation được cập nhật.
- Nếu có AI: schema validation, fallback, evaluation và prompt version đã cập nhật.
- Đã deploy staging và smoke test.
- Không còn bug P0/P1 liên quan story.

