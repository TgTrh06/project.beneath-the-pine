# Quyền tham gia beta — AccessModule

- **Trạng thái code:** Nest module được đăng ký; chưa có controller, use case, repository hoặc schema nghiệp vụ.
- **Thứ tự triển khai:** P2 / S6 nếu beta gate còn dùng.
- **Phạm vi hiện tại:** Core thủ công, không AI.

## Trách nhiệm và dữ liệu

Điều kiện tham gia sản phẩm, invitation và member state; tách khỏi login.

**Dữ liệu sở hữu dự kiến:** waitlist/invitations/membership theo scope beta; chưa có schema. Đây là inventory thiết kế, chưa là migration.

## Use case cần xây

- JoinWaitlist/AcceptInvitation: chỉ khi xác nhận beta flow.
- CheckMembership: quyết định truy cập capability yêu cầu beta.
- GrantOrRevokeMembership: chỉ cho actor có quyền quản trị được duyệt.

## API dự kiến

Các route dưới đây dùng prefix `/api/v1` khi được triển khai; chưa hoạt động trong scaffold.

- POST /waitlist (nếu dùng)
- POST /invitations/:token/accept (nếu dùng)
- Chưa mở admin route trong scaffold

## Phụ thuộc và interface

Identity principal/status; không gom product rules vào authorization guard chung.

**Public application interface dự kiến:** Membership decision contract; không export danh sách email/roles ra client. Chỉ tạo interface/provider code khi có use case hoặc consumer thực sự; hiện chưa có stub trả kết quả giả.

## Invariant và boundary

- Đăng nhập thành công không đồng nghĩa được cấp beta/admin.
- Invitation expiry, dùng một lần, không lưu plaintext token trong log.
- Không có gửi email hoặc provider ở giai đoạn này.

## Acceptance criteria cho implementation

- [ ] Không tự nâng quyền từ payload, token replay/expiry, revoke có hiệu lực.
- [ ] Admin operation thiếu quyền bị từ chối.

## Privacy và retention

Waitlist/membership có retention; export/delete hoặc tách audit theo policy.

## Cần chốt trước slice

Beta gate có còn cần khi public alpha, role model tối thiểu và delivery invitation.

Xem [Module delivery plan](../../../../../docs/04-engineering/module-delivery-plan.md) và [module catalog](../../../../../docs/02-product/application-modules-spec.md). Module `access` là boundary bên trong một API deployable, không phải microservice.
