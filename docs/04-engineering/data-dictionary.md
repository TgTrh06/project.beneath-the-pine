# Data Dictionary — Danh mục dữ liệu và thuộc tính

Ngày đối chiếu: **2026-09-10**. Nguồn: working tree hiện tại, gồm cả mã chưa commit.

## 1. Phạm vi và cách đọc

Tài liệu mô tả cấu trúc trong repository, không xác nhận migration đã chạy trên database thực tế và không chứa bản ghi người dùng. Bao gồm 19 bảng từ migration Supabase, 2 bảng Core Java, Java model/DTO, Zod contract và model dữ liệu frontend. Class điều phối, repository, controller, dependency injection và props thuần giao diện không phải danh mục dữ liệu nghiệp vụ.

- **Có trong migration**: có DDL trong repo; không đồng nghĩa đã triển khai.
- **Có trong code**: có class/type/schema; không đồng nghĩa mọi API tương ứng đã chạy.
- **Thiết kế**: chưa có bảng trong các migration đã đối chiếu.
- **NULL** áp dụng ở SQL; dấu hỏi sau thuộc tính TypeScript nghĩa là được bỏ qua, khác với null.
- **—** ở cột mặc định: không khai báo DEFAULT trong SQL. Ứng dụng vẫn có thể gán giá trị.
- PK: khóa chính; FK: khóa ngoại; UNIQUE: duy nhất. Ý nghĩa trường được diễn giải theo tên và nơi sử dụng; ràng buộc lấy từ nguồn.
- updated_at DEFAULT now() chỉ gán lúc INSERT; các migration này không khai báo trigger tự cập nhật.
- Schema public dưới đây là schema Supabase mà các migration hướng tới; bảng không ghi prefix trong DDL phụ thuộc search_path khi chạy.

## 2. Database: từng bảng và trường

Nguồn lịch sử: [Supabase core](../../supabase/migrations/0000_big_the_spike.sql), [RLS](../../supabase/migrations/0001_enable_row_level_security.sql), [Research pilot](../../supabase/migrations/0002_research_pilot.sql).
Nguồn Java: [V1 tạo schema core](../../services/core-service/src/main/resources/db/migration/V1__create_core_schema.sql), [V2 task module](../../services/core-service/src/main/resources/db/migration/V2__create_task_module.sql).

Enum SQL: public.energy_level = low / medium / high; public.member_status = waitlisted / active / revoked; public.task_status = ready / done / deferred / archived.
Không suy ra enum/check cho cột varchar nếu DDL không có ràng buộc.

### `public.ai_usage`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `user_id` | `uuid` | Không | — | Người sở hữu |
| `kind` | `varchar(32)` | Không | — | Loại sử dụng AI |
| `week_start` | `date` | Không | — | Ngày bắt đầu tuần |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
```

### `public.beta_members`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `user_id` | `uuid` | Không | — | Người sở hữu; PK |
| `status` | `"member_status"` | Không | `'waitlisted'` | Trạng thái |
| `approved_at` | `timestamp with time zone` | Có | — | Thời điểm phê duyệt |
| `approved_by` | `uuid` | Có | — | ID người phê duyệt |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "beta_members" ADD CONSTRAINT "beta_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
```

### `public.brain_dumps`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `user_id` | `uuid` | Không | — | Người sở hữu |
| `ciphertext` | `text` | Không | — | Nội dung đã mã hóa |
| `iv` | `varchar(64)` | Không | — | Vector khởi tạo mã hóa |
| `key_version` | `varchar(40)` | Không | — | Phiên bản khóa mã hóa |
| `expires_at` | `timestamp with time zone` | Không | — | Thời điểm hết hạn |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "brain_dumps" ADD CONSTRAINT "brain_dumps_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
```

### `public.checkins`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `user_id` | `uuid` | Không | — | Người sở hữu |
| `energy` | `"energy_level"` | Không | — | Mức năng lượng |
| `ciphertext` | `text` | Có | — | Nội dung đã mã hóa |
| `iv` | `varchar(64)` | Có | — | Vector khởi tạo mã hóa |
| `key_version` | `varchar(40)` | Có | — | Phiên bản khóa mã hóa |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
```

### `public.consents`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `user_id` | `uuid` | Không | — | Người sở hữu |
| `ai_processing` | `boolean` | Không | — | Đồng ý xử lý AI |
| `content_retention` | `boolean` | Không | — | Đồng ý lưu nội dung |
| `research_analytics` | `boolean` | Không | `false` | Đồng ý phân tích nghiên cứu |
| `version` | `varchar(32)` | Không | `'2026-08-beta'` | Phiên bản consent |
| `revoked_at` | `timestamp with time zone` | Có | — | Thời điểm thu hồi |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
```

### `public.daily_resets`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `user_id` | `uuid` | Không | — | Người sở hữu |
| `energy` | `"energy_level"` | Không | — | Mức năng lượng |
| `available_minutes` | `integer` | Không | — | Số phút có thể dành ra |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "daily_resets" ADD CONSTRAINT "daily_resets_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
```

### `public.experiments`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `review_id` | `uuid` | Không | — | Bản tổng kết tuần liên quan |
| `user_id` | `uuid` | Không | — | Người sở hữu |
| `title` | `varchar(160)` | Không | — | Tiêu đề |
| `why` | `varchar(280)` | Không | — | Lý do đề xuất thử nghiệm |
| `approved_at` | `timestamp with time zone` | Có | — | Thời điểm phê duyệt |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_review_id_weekly_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."weekly_reviews"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
```

### `public.focus_sessions`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `user_id` | `uuid` | Không | — | Người sở hữu |
| `task_id` | `uuid` | Có | — | Task liên quan |
| `planned_minutes` | `integer` | Không | — | Số phút dự kiến |
| `started_at` | `timestamp with time zone` | Không | `now()` | Thời điểm bắt đầu |
| `completed_at` | `timestamp with time zone` | Có | — | Thời điểm hoàn thành |
| `outcome` | `varchar(20)` | Có | — | Kết quả phiên tập trung |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
```

### `public.habit_completions`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `habit_id` | `uuid` | Không | — | Thói quen liên quan |
| `user_id` | `uuid` | Không | — | Người sở hữu |
| `completed_on` | `date` | Không | — | Ngày hoàn thành |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "habit_completions" ADD CONSTRAINT "habit_completions_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "habit_completions" ADD CONSTRAINT "habit_completions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "habit_completion_once_per_day" ON "habit_completions" USING btree ("habit_id","completed_on");
```

### `public.habits`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `user_id` | `uuid` | Không | — | Người sở hữu |
| `title` | `varchar(100)` | Không | — | Tiêu đề |
| `archived_at` | `timestamp with time zone` | Có | — | Thời điểm lưu trữ |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
```

### `public.next_actions`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `task_id` | `uuid` | Không | — | Task liên quan |
| `title` | `varchar(280)` | Không | — | Tiêu đề |
| `minutes` | `integer` | Không | — | Thời lượng theo phút |
| `confirmed_at` | `timestamp with time zone` | Có | — | Thời điểm xác nhận hành động |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "next_actions" ADD CONSTRAINT "next_actions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
```

### `public.product_events`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `user_id` | `uuid` | Có | — | Người sở hữu |
| `name` | `varchar(64)` | Không | — | Tên người đăng ký hoặc tên sự kiện tùy bảng |
| `occurred_at` | `timestamp with time zone` | Không | `now()` | Thời điểm sự kiện xảy ra |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
```

### `public.profiles`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | Định danh bản ghi; PK |
| `display_name` | `varchar(80)` | Có | — | Tên hiển thị |
| `timezone` | `varchar(64)` | Không | `'Asia/Ho_Chi_Minh'` | Múi giờ |
| `onboarding_completed_at` | `timestamp with time zone` | Có | — | Thời điểm hoàn tất onboarding |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

### `public.roles`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `user_id` | `uuid` | Không | — | Người sở hữu; PK |
| `role` | `varchar(20)` | Không | `'member'` | Vai trò |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "roles" ADD CONSTRAINT "roles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
```

### `public.tasks`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `user_id` | `uuid` | Không | — | Người sở hữu |
| `title` | `varchar(280)` | Không | — | Tiêu đề |
| `minutes` | `integer` | Không | `10` | Thời lượng theo phút |
| `status` | `"task_status"` | Không | `'ready'` | Trạng thái |
| `source_brain_dump_id` | `uuid` | Có | — | Brain Dump nguồn |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_source_brain_dump_id_brain_dumps_id_fk" FOREIGN KEY ("source_brain_dump_id") REFERENCES "public"."brain_dumps"("id") ON DELETE set null ON UPDATE no action;
```

### `public.waitlist_entries`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `email` | `varchar(320)` | Không | — | Địa chỉ email |
| `name` | `varchar(80)` | Có | — | Tên người đăng ký hoặc tên sự kiện tùy bảng |
| `context` | `varchar(500)` | Có | — | Ngữ cảnh do người dùng cung cấp |
| `status` | `"member_status"` | Không | `'waitlisted'` | Trạng thái |
| `approved_at` | `timestamp with time zone` | Có | — | Thời điểm phê duyệt |
| `approved_by` | `uuid` | Có | — | ID người phê duyệt |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
CREATE UNIQUE INDEX "waitlist_email_unique" ON "waitlist_entries" USING btree ("email");
```

### `public.weekly_reviews`

Nguồn: [supabase/migrations/0000_big_the_spike.sql](../../supabase/migrations/0000_big_the_spike.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `user_id` | `uuid` | Không | — | Người sở hữu |
| `week_start` | `date` | Không | — | Ngày bắt đầu tuần |
| `facts` | `jsonb` | Không | — | Dữ kiện tổng kết JSON; SQL chưa định nghĩa cấu trúc con |
| `summary` | `text` | Có | — | Tóm tắt |
| `insight` | `text` | Có | — | Nhận định |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
```

### `public.research_enrollments`

Nguồn: [supabase/migrations/0002_research_pilot.sql](../../supabase/migrations/0002_research_pilot.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `user_id` | `uuid` | Không | — | Người sở hữu |
| `participant_code` | `varchar(24)` | Không | — | Mã người tham gia |
| `sequence` | `varchar(32)` | Không | — | Thứ tự điều kiện nghiên cứu |
| `consented_at` | `timestamp with time zone` | Không | `now()` | Thời điểm đồng ý nghiên cứu |
| `withdrawn_at` | `timestamp with time zone` | Có | — | Thời điểm rút khỏi nghiên cứu |
| `retention_until` | `timestamp with time zone` | Không | — | Hạn lưu dữ liệu nghiên cứu |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
"user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE cascade
CREATE UNIQUE INDEX "research_enrollment_user_unique" ON "research_enrollments" USING btree ("user_id");
CREATE UNIQUE INDEX "research_enrollment_code_unique" ON "research_enrollments" USING btree ("participant_code");
```

### `public.research_sessions`

Nguồn: [supabase/migrations/0002_research_pilot.sql](../../supabase/migrations/0002_research_pilot.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | `gen_random_uuid()` | Định danh bản ghi; PK |
| `enrollment_id` | `uuid` | Không | — | Lượt đăng ký nghiên cứu |
| `condition` | `varchar(20)` | Không | — | Điều kiện nghiên cứu |
| `stuck_at` | `timestamp with time zone` | Không | `now()` | Thời điểm ghi nhận bị mắc kẹt |
| `started_at` | `timestamp with time zone` | Có | — | Thời điểm bắt đầu |
| `completed_at` | `timestamp with time zone` | Có | — | Thời điểm hoàn thành |
| `friction_before` | `integer` | Không | — | Mức khó bắt đầu trước phiên |
| `friction_after` | `integer` | Có | — | Mức khó bắt đầu sau phiên |
| `focus_outcome` | `varchar(20)` | Có | — | Kết quả tập trung trong nghiên cứu |
| `created_at` | `timestamp with time zone` | Không | `now()` | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | `now()` | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
"enrollment_id" uuid NOT NULL REFERENCES "research_enrollments"("id") ON DELETE cascade
```

### `core.tasks`

Nguồn: [services/core-service/src/main/resources/db/migration/V2__create_task_module.sql](../../services/core-service/src/main/resources/db/migration/V2__create_task_module.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | Định danh bản ghi; PK |
| `user_id` | `uuid` | Không | — | Người sở hữu |
| `title` | `varchar(280)` | Không | — | Tiêu đề |
| `minutes` | `integer` | Không | — | Thời lượng theo phút |
| `status` | `varchar(20)` | Không | — | Trạng thái |
| `source_brain_dump_id` | `uuid` | Có | — | Brain Dump nguồn |
| `created_at` | `timestamp with time zone` | Không | — | Thời điểm tạo |
| `updated_at` | `timestamp with time zone` | Không | — | Thời điểm cập nhật được lưu |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
constraint tasks_title_length check (char_length(btrim(title)) between 2 and 280)
constraint tasks_minutes_range check (minutes between 1 and 10)
constraint tasks_status_allowed check (status in ('ready', 'done', 'deferred', 'archived'))
create index tasks_user_created_at_idx
    on core.tasks (user_id, created_at desc);
create index tasks_user_status_created_at_idx
    on core.tasks (user_id, status, created_at desc);
```

### `core.next_actions`

Nguồn: [services/core-service/src/main/resources/db/migration/V2__create_task_module.sql](../../services/core-service/src/main/resources/db/migration/V2__create_task_module.sql). Trạng thái: có trong migration.

| Trường | Kiểu SQL | NULL? | DEFAULT | Ý nghĩa |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Không | — | Định danh bản ghi; PK |
| `task_id` | `uuid` | Không | — | Task liên quan |
| `title` | `varchar(280)` | Không | — | Tiêu đề |
| `minutes` | `integer` | Không | — | Thời lượng theo phút |
| `confirmed_at` | `timestamp with time zone` | Không | — | Thời điểm xác nhận hành động |

Ràng buộc / index khai báo (trích SQL, gồm FK và hành vi xóa nếu có):

```sql
task_id uuid not null unique
constraint next_actions_task_fk
foreign key (task_id) references core.tasks (id) on delete cascade
constraint next_actions_title_length check (char_length(btrim(title)) between 2 and 280)
constraint next_actions_minutes_range check (minutes between 1 and 10)
```

## 3. Quan hệ, quyền truy cập và khác biệt giữa hai schema

Trong `public`, các FK đến `profiles.id` và quan hệ review → experiments, habit → completions, task → next_actions, enrollment → sessions được mô tả bằng SQL dưới từng bảng. Xóa task đặt `focus_sessions.task_id` về NULL; xóa Brain Dump đặt `tasks.source_brain_dump_id` về NULL; xóa profile đặt `product_events.user_id` về NULL. Các FK khác đã liệt kê dùng CASCADE. `profiles.id` không có FK đến `auth.users` trong các migration này; `approved_by` cũng không có FK.

RLS được bật cho cả 19 bảng public. Policy owner dùng `auth.uid()` với `id` của profiles hoặc `user_id`; next_actions xác định owner qua tasks, research_sessions qua research_enrollments. beta_members, roles và ai_usage chỉ có policy SELECT của owner. waitlist_entries bật RLS nhưng không khai báo policy ở các file này. Đây là quyền theo policy cho vai trò chịu RLS, không phải mô tả quyền của role bypass RLS.

| Điểm so sánh | Supabase public | Core Java |
| --- | --- | --- |
| tasks.id / next_actions.id | DEFAULT gen_random_uuid() | Java tạo UUID; SQL không có DEFAULT |
| tasks.minutes / status | DEFAULT 10 / ready | Không DEFAULT SQL; Task.create gán READY, minutes do input |
| timestamps | Nhiều cột DEFAULT now() | Java cấp Instant từ Clock |
| tasks.title / minutes | varchar(280), integer; không CHECK khoảng | CHECK title sau btrim dài 2–280, minutes 1–10 |
| tasks.status | PostgreSQL enum | varchar(20) + CHECK 4 trạng thái |
| tasks.user_id / source_brain_dump_id | Có FK | V3 thêm FK user_id → core.accounts; source_brain_dump_id chưa có FK |
| next_actions.task_id | FK; không UNIQUE | FK CASCADE + UNIQUE: mỗi task tối đa một next action |
| next_actions.confirmed_at | Nullable | NOT NULL |
| next_actions.created_at / updated_at | Có | Không có |
| Phạm vi owner | RLS public | V3 liên kết owner với core.accounts; repository task truy vấn theo userId từ session principal |

Core có hai index trên tasks: `(user_id, created_at DESC)` và `(user_id, status, created_at DESC)`. Các UNIQUE index public gồm email waitlist, cặp habit/ngày, user đăng ký nghiên cứu và participant_code. Không suy ra những index kỳ vọng trong tài liệu thiết kế là đã tồn tại.

## 4. Java domain, entity và DTO

Nguồn gốc package: [core Java](../../services/core-service/src/main/java/com/itsumori/beneaththepine/core). Các model dưới đây **có trong code**.

### 4.0 Account và session authentication

Nguồn: [AccountEntity](../../services/core-service/src/main/java/com/itsumori/beneaththepine/core/identity/infrastructure/AccountEntity.java), [AccountPrincipal](../../services/core-service/src/main/java/com/itsumori/beneaththepine/core/shared/security/AccountPrincipal.java), migration `V3__create_accounts.sql`.

| core.accounts | Java | Kiểu | Quy tắc |
| --- | --- | --- | --- |
| id | id | UUID | Primary key; sinh khi đăng ký; cũng là owner ID của dữ liệu nghiệp vụ |
| email | email | String | Bắt buộc; trim, lowercase, unique; tối đa 320 ký tự |
| password_hash | passwordHash | String | BCrypt work factor 12; không xuất ra response hoặc log |
| enabled | enabled | boolean | Mặc định true; principal bị vô hiệu hóa không đăng nhập được |
| created_at | createdAt | Instant | Bắt buộc |
| updated_at | updatedAt | Instant | Bắt buộc; bằng created_at trong lát cắt hiện tại |

`CredentialsRequest` nhận email hợp lệ và password 12–64 ký tự, đồng thời giới hạn input UTF-8 ở 72 byte để tránh BCrypt âm thầm bỏ phần cuối. `AuthSessionResponse` trả `authenticated`, user `{id,email}` nếu có và CSRF token; session credential thật chỉ nằm trong cookie HttpOnly.

### 4.1 Task: mapping đầy đủ

Nguồn: [Task](../../services/core-service/src/main/java/com/itsumori/beneaththepine/core/task/domain/Task.java), [TaskEntity](../../services/core-service/src/main/java/com/itsumori/beneaththepine/core/task/infrastructure/TaskEntity.java), [TaskResponse](../../services/core-service/src/main/java/com/itsumori/beneaththepine/core/task/presentation/TaskResponse.java), [Zod contracts](../../packages/contracts/src/index.ts).

| core.tasks | Thuộc tính domain / entity / response | Kiểu Java (domain; entity/response nếu khác) | JSON / taskSchema | Quy tắc |
| --- | --- | --- | --- | --- |
| id | id | UUID | string UUID | Bắt buộc; sinh khi tạo; bất biến trong domain |
| user_id | userId | UUID | string UUID | Bắt buộc; owner từ account principal; bất biến |
| title | title | String | string | Bắt buộc; Task trim rồi kiểm tra dài 2–280 |
| minutes | minutes | int | number nguyên | Bắt buộc; 1–10 |
| status | status | TaskStatus; String | ready / done / deferred / archived | Bắt buộc; tạo mới ready |
| source_brain_dump_id | sourceBrainDumpId | UUID | string UUID hoặc null | Nullable; bất biến trong domain; không xác minh bằng FK core |
| created_at | createdAt | Instant | string datetime | Bắt buộc; bất biến |
| updated_at | updatedAt | Instant | string datetime | Bắt buộc; cập nhật khi đổi task |

`TaskStatus` có `READY("ready")`, `DONE("done")`, `DEFERRED("deferred")`, `ARCHIVED("archived")` và thuộc tính `value: String`. `fromValue` chỉ nhận đúng giá trị. Task đã archived không được đổi tiếp; chuyển sang archived phải qua thao tác archive riêng. Java DTO validation xét độ dài chuỗi trước khi domain trim; không nên coi mọi chi tiết trim/độ dài giữa Java, Zod và SQL là hoàn toàn tương đương.

### 4.2 NextAction: mapping đầy đủ

Nguồn: [NextAction](../../services/core-service/src/main/java/com/itsumori/beneaththepine/core/task/domain/NextAction.java), [NextActionEntity](../../services/core-service/src/main/java/com/itsumori/beneaththepine/core/task/infrastructure/NextActionEntity.java), [ConfirmedNextActionResponse](../../services/core-service/src/main/java/com/itsumori/beneaththepine/core/task/presentation/ConfirmedNextActionResponse.java).

| core.next_actions | Thuộc tính domain / entity | Java | Response / confirmedNextActionSchema | Quy tắc |
| --- | --- | --- | --- | --- |
| id | id | UUID | Không xuất ra response | Bắt buộc; Java sinh UUID |
| task_id | taskId | UUID | taskId: string UUID | Bắt buộc; FK + UNIQUE |
| title | title | String | title: string | Bắt buộc; confirm sao chép từ Task; SQL/Zod kiểm tra 2–280 |
| minutes | minutes | int | minutes: number nguyên | confirm sao chép từ Task; SQL/Zod kiểm tra 1–10 |
| confirmed_at | confirmedAt | Instant | confirmedAt: string datetime | Bắt buộc; thời điểm confirm |

Constructor NextAction chỉ kiểm tra non-null cho id/taskId/title/confirmedAt, không tự kiểm tra khoảng minutes hay độ dài title. Luồng confirm nhận Task đã được kiểm tra. NextAction là snapshot lúc xác nhận: luồng UpdateTask hiện chỉ cập nhật TaskEntity, không cập nhật NextActionEntity.

### 4.3 Request, response và command

Nguồn: [presentation](../../services/core-service/src/main/java/com/itsumori/beneaththepine/core/task/presentation), [application](../../services/core-service/src/main/java/com/itsumori/beneaththepine/core/task/application). Mỗi mục dưới liệt kê toàn bộ trường, không bao gồm dependency của use case.

| Class / record | Thuộc tính và kiểu | Bắt buộc, mặc định và ý nghĩa |
| --- | --- | --- |
| CreateNextActionRequest | title: String; minutes: int; sourceBrainDumpId: UUID | title NotBlank, Size 2–280; minutes 1–10; sourceBrainDumpId nullable |
| UpdateTaskRequest | title: String; minutes: Integer; status: String | Cho phép null/bỏ qua từng trường; cần ít nhất một khác null. title Size 2–280 và domain trim; minutes 1–10; status chỉ ready/done/deferred |
| TaskResponse | id, userId, title, minutes, status, sourceBrainDumpId, createdAt, updatedAt | Kiểu và quy tắc theo bảng Task |
| ConfirmedNextActionResponse | taskId, title, minutes, confirmedAt | Theo bảng NextAction; không trả id của next action |
| CreateNextActionResponse | task: TaskResponse; nextAction: ConfirmedNextActionResponse | Kết quả tạo đồng thời task và hành động xác nhận |
| TaskListResponse | tasks: List<TaskResponse> | Danh sách; có thể rỗng |
| CreateNextAction.Command | userId: UUID; title: String; minutes: int; sourceBrainDumpId: UUID | owner do controller lấy từ session principal; source nullable; domain kiểm tra title/minutes |
| CreateNextAction.Result | task: Task; nextAction: NextAction | Kết quả use case |
| UpdateTask.Command | userId: UUID; taskId: UUID; title: String; minutes: Integer; status: TaskStatus | Hai ID xác định owner/task; ba trường cập nhật nullable, ít nhất một khác null |

Query `GET /api/v1/tasks` có `status: String` tùy chọn (cả 4 trạng thái), `limit: int` mặc định 50, từ 1–100. Các thao tác theo task nhận `taskId: UUID` từ path; userId lấy từ account principal trong session, không từ body.

Nguồn lỗi: [ApiError](../../services/core-service/src/main/java/com/itsumori/beneaththepine/core/shared/error/ApiError.java), [ApiErrorDetail](../../services/core-service/src/main/java/com/itsumori/beneaththepine/core/shared/error/ApiErrorDetail.java).

| Model lỗi | Trường | Ý nghĩa |
| --- | --- | --- |
| ApiError | code: String; message: String; requestId: String; details: List<ApiErrorDetail> | Mã lỗi, thông báo, ID đối chiếu request, lỗi từng trường; factory of tạo details rỗng |
| ApiErrorDetail | field: String; code: String | Tên trường lỗi và mã validation; record không khai báo null validation |

## 5. Shared Zod contracts

Nguồn: [packages/contracts/src/index.ts](../../packages/contracts/src/index.ts). Đây là định nghĩa và validation trong code; chỉ việc export schema chưa chứng minh một endpoint đang dùng nó. Trừ khi ghi optional/nullable/default, trường là bắt buộc. Các giới hạn dưới đây thuộc contract, không tự trở thành CHECK của DB.

### 5.1 Input và Task

| Schema | Trường, kiểu, validation và mapping |
| --- | --- |
| waitlistSchema | email: string email → waitlist_entries.email; name?: string trim 1–80 → name; context?: string trim tối đa 500 → context. email không có max(320) trong Zod dù SQL có varchar(320) |
| consentSchema | aiProcessing: literal true → ai_processing; contentRetention: literal true → content_retention; researchAnalytics: boolean default false → research_analytics |
| brainDumpSchema | content: string trim 3–6000; nội dung đầu vào, không có cột content plaintext; bảng brain_dumps lưu ciphertext/iv/key_version |
| nextActionSchema | title: string trim 2–280; minutes: integer 1–10; sourceBrainDumpId?: string UUID. Mapping request Java ở mục 4 |
| taskSchema | 8 trường theo bảng 4.1; sourceBrainDumpId bắt buộc có key nhưng cho null |
| confirmedNextActionSchema | taskId: UUID string; title: string trim 2–280; minutes: integer 1–10; confirmedAt: datetime string |
| createNextActionResponseSchema | task: taskSchema; nextAction: confirmedNextActionSchema |
| updateTaskSchema | title?: string trim 2–280; minutes?: integer 1–10; status?: mutableTaskStatusSchema. Ít nhất một trường khác undefined; không chấp nhận null |
| taskListResponseSchema | tasks: taskSchema[]; không đặt min/max số phần tử |
| helpMeStartSchema | taskId: string UUID; context?: string trim tối đa 1200. Context không có cột tương ứng trong task |
| habitSchema | title: string trim 1–100 → habits.title |
| checkInSchema | energy: low/medium/high → checkins.energy; note?: string trim tối đa 1000; note là nội dung đầu vào, DB lưu bộ trường mã hóa |
| studyEnrollmentSchema | consent: literal true; không có cột consent boolean, bảng research_enrollments có consented_at |
| studySessionSchema | frictionBefore: integer 1–5 → research_sessions.friction_before |
| studySessionStartSchema | startedAt?: string datetime → started_at |
| studySessionCompleteSchema | frictionAfter: integer 1–5 → friction_after; focusOutcome: done/still_stuck/not_recorded → focus_outcome |

Type suy ra: `Task`, `TaskStatus`, `ConfirmedNextAction`, `CreateNextActionResponse`, `UpdateTaskInput` tương ứng các schema cùng tên. `taskStatusSchema` cho 4 trạng thái; `mutableTaskStatusSchema` loại archived. `studyConditionSchema` / `StudyCondition` = control/intervention; cột SQL condition vẫn là varchar(20), không có CHECK enum.

### 5.2 Kết quả AI, gồm trường lồng nhau

| Schema / type | Trường | Kiểu và validation | Ý nghĩa / lưu trữ |
| --- | --- | --- | --- |
| brainDumpAiSchema / BrainDumpAiOutput | acknowledgement | string, tối đa 280 | Lời ghi nhận |
| | candidates | array, 1–4 phần tử | Các hành động gợi ý |
| | candidates[].title | string, 2–280 | Tiêu đề gợi ý |
| | candidates[].minutes | integer, 1–10 | Thời lượng gợi ý |
| helpMeStartAiSchema / HelpMeStartAiOutput | acknowledgement | string, tối đa 280 | Lời ghi nhận |
| | tinyStep | string, 2–280 | Bước bắt đầu nhỏ |
| | options | string[], tối đa 3 phần tử; mỗi chuỗi 2–220 | Các lựa chọn; mảng được phép rỗng |
| | minutes | integer, 1–10 | Thời lượng |
| weeklyReviewAiSchema / WeeklyReviewAiOutput | summary | string, tối đa 600 | Tương ứng về nghĩa với weekly_reviews.summary |
| | insight | string, tối đa 400 | Tương ứng về nghĩa với weekly_reviews.insight |
| | experiment | object | Đề xuất thử nghiệm |
| | experiment.title | string, 2–160 | Tương ứng experiments.title |
| | experiment.why | string, tối đa 280 | Tương ứng experiments.why |
| Cả ba schema | safety | object bắt buộc | Metadata an toàn; không có cột riêng trong các migration này |
| | safety.needsHumanSupport | boolean bắt buộc | Có cần hỗ trợ từ người hay không |
| | safety.message | string optional, tối đa 400 | Thông điệp hỗ trợ |

Các chuỗi AI trên không khai báo trim. Mapping về nghĩa không xác nhận đã có Java persistence cho AI output.

### 5.3 Enum và quota

`AiQuotaKind` / `aiQuotaKinds`: brain_dump, help_me_start, weekly_review. `weeklyQuota` là Record trong code: lần lượt **3, 5, 1** mỗi tuần; không phải bảng cấu hình DB. `ai_usage.kind` là varchar(32), không có CHECK ép ba giá trị này.

`ProductEventName` / `eventNames`: brain_dump_submitted, next_action_confirmed, start_event, focus_completed, still_stuck, reset_completed, return_flow_completed. Tương ứng về nghĩa với `product_events.name`; SQL không có CHECK giới hạn danh sách.

## 6. Frontend models và payload đang khai báo

### 6.1 Domain và state

Nguồn: [domain.ts](../../apps/web/src/shared/types/domain.ts). Các type frontend chỉ cung cấp kiểm tra TypeScript; bản thân chúng không validate UUID, khoảng số hoặc độ dài chuỗi lúc chạy.

| Model | Tất cả thuộc tính / giá trị | Ý nghĩa và đối chiếu |
| --- | --- | --- |
| View | now / capture / habits / review / study / settings / admin | Màn hình; không phải bảng |
| TaskStatus | ready / done / deferred | Thiếu archived so với shared contract và Java |
| Task | id: string; title: string; minutes: number; status: TaskStatus | Bản rút gọn của task; không chứa owner, nguồn hoặc timestamps |
| Habit | id: string; title: string; completed: boolean | completed là trạng thái UI; SQL dùng habit_completions theo ngày, không có cột habits.completed |
| Energy | low / medium / high | Cùng tập giá trị energy_level |
| HelpSuggestion | taskId: string; title: string; minutes: number | Gợi ý hiển thị; không có bảng HelpSuggestion |
| WeeklyReviewContent | summary: string; insight: string; experiment: { title: string; why: string } | Nội dung review hiển thị; không gồm ID hoặc safety |

Model cục bộ: [FocusRoom](../../apps/web/src/features/focus/FocusRoom.tsx) có `FocusTask { title: string; minutes: number }`; [AdminView](../../apps/web/src/features/admin/AdminView.tsx) có `Entry { id: string; email: string; name: string | null; status: string }`; [StudyView](../../apps/web/src/features/study/StudyView.tsx) có `Condition = control | intervention`.

[focusTimer](../../apps/web/src/features/focus/focusTimer.ts) có `FocusTimerStatus = idle | running | paused | finished`; state `seconds: number` khởi tạo 0 và `status` khởi tạo idle. Đây là bộ đếm UI, không ánh xạ trực tiếp thành bản ghi focus_sessions.

### 6.2 Model API phía client

Nguồn: [api.ts](../../apps/web/src/shared/api/api.ts). Đây là hình dạng client đang kỳ vọng, không xác nhận toàn bộ endpoint có implementation Java.

| Model | Tất cả thuộc tính và kiểu | Mapping / ghi chú |
| --- | --- | --- |
| RemoteTask | id: string; title: string; minutes: number; status: ready/done/deferred; userId?: string; sourceBrainDumpId?: string hoặc null | Task rút gọn; không có createdAt/updatedAt, chưa hỗ trợ archived |
| Bootstrap | profile: unknown; consent: object hoặc null; tasks: RemoteTask[]; habits: { id: string; title: string }[]; isAdmin: boolean; quota: Record<string, { used: number; remaining: number }> | Dữ liệu khởi tạo; cấu trúc profile chưa được xác định trong type này |
| Bootstrap.consent | aiProcessing: boolean; contentRetention: boolean | Cờ consent; không khai báo researchAnalytics |
| StudyState | enrollment: object hoặc null; condition: control/intervention hoặc null | Trạng thái nghiên cứu |
| StudyState.enrollment | id: string; participantCode: string; sequence: control_first/intervention_first; retentionUntil: string | Mapping về nghĩa lần lượt đến id, participant_code, sequence, retention_until; SQL không CHECK sequence |
| ApiError (client) | error?: string; message?: string | Client đọc mã lỗi từ error, trong khi Java trả code: khác biệt hiện có |
| ApiRequestError | message: string; status?: number; code?: string | Error phía client; status là HTTP status; message kế thừa Error |
| AuthSession | subject: string; email: string | Model phiên tối thiểu do [auth.ts](../../apps/web/src/shared/auth/auth.ts) sở hữu; credential thật nằm trong cookie HttpOnly do browser quản lý |

### 6.3 Payload inline trong các hàm API

Các hàm yêu cầu đăng nhập nhận `AuthSession`; API client gửi session cookie bằng `credentials: include` và gắn CSRF header cho mutation. Các trường dưới đây bắt buộc trừ khi có dấu `?`. Kiểu trả về unknown hoặc không khai báo cụ thể được giữ nguyên, không suy đoán thêm trường.

| Hàm | Input nghiệp vụ | Kết quả được client khai báo |
| --- | --- | --- |
| joinWaitlist | email: string; name?: string; context?: string | API { ok: boolean }; khi chưa cấu hình trả { ok: true, demo: true } |
| getBootstrap | Không có body nghiệp vụ | Bootstrap |
| recordConsent | Body cố định aiProcessing=true, contentRetention=true, researchAnalytics=false | void |
| submitBrainDump | content: string | { suggestion: { candidates: { title: string; minutes: number }[] } } |
| createNextAction | task: { title: string; minutes: number } | { task: RemoteTask }; type client không khai báo nextAction của Java response |
| helpMeStart | taskId: string | { suggestion: { tinyStep: string; minutes: number; options: string[] } } |
| startFocus | taskId: string; plannedMinutes: number | { session: { id: string } } |
| finishFocus | sessionId: string (path); outcome: done/still_stuck/paused | Không định nghĩa shape response cụ thể |
| createHabit | title: string | { habit: { id: string; title: string } } |
| completeHabit | id: string (path) | { ok: true; completedOn: string } |
| saveCheckin | energy: low/medium/high; note?: string | Không định nghĩa shape response cụ thể |
| createWeeklyReview | Không có body nghiệp vụ | { review: { summary: string; insight: string }; experiment: { id: string; title: string; why: string } } |
| exportData | Không có body | unknown |
| deleteAccount | Không có body | void |
| getAdminWaitlist | Không có body | { entries: { id: string; email: string; name: string hoặc null; status: string; createdAt: string }[] } |
| approveWaitlist | id: string (path) | Không định nghĩa shape response cụ thể |
| getStudy / enrollStudy | get: không body; enroll: consent=true | StudyState |
| beginStudySession | frictionBefore: number | { session: { id: string; condition: control/intervention; stuckAt: string } } |
| markStudyStarted | id: string (path); body {} | { session: { id: string; startedAt: string } } |
| completeStudySession | id: string (path); frictionAfter: number; focusOutcome: done/still_stuck/not_recorded | { session: { id: string } } |
| withdrawStudy | Không có body | void |

### 6.4 Metadata logging

Nguồn: [logger.ts](../../apps/web/src/shared/logging/logger.ts). `FrontendErrorContext`: event: string, area: api/auth/runtime/react, method?: string, path?: string, status?: number, code?: string. event/area bắt buộc; các trường khác tùy chọn. `SafeRecord` giữ cùng cấu trúc; hàm tạo record chỉ lấy các trường được liệt kê. Không có bảng log frontend trong các migration đã đọc.

## 7. Dữ liệu mới ở mức thiết kế

Nguồn: [Data Model](data-model.md). Các mục sau chưa có CREATE TABLE trong migration đã đối chiếu; không gán kiểu SQL, nullability hoặc default khi thiết kế chưa chốt.

| Nhóm / entity | Thuộc tính hoặc phạm vi đã được mô tả | Trạng thái |
| --- | --- | --- |
| engagement_preferences | user_id PK/FK; theme enum forest_light/twilight/night; audio_preference JSONB; reminders_enabled; timezone; created_at; updated_at | Thiết kế |
| reminder_slots | id; user_id; local_time; days_of_week; channel in_app/email; enabled; last_delivered_at; timestamps | Thiết kế; tối đa 2 active slot/user là yêu cầu application, chưa có enforcement ở migration |
| focus_seeds | id; user_id; task_id?; prompt tối đa 280; remind_at?; status open/opened/dismissed/expired; created_at; opened_at; dismissed_at | Thiết kế; yêu cầu tối đa 1 seed open/user |
| weekly_letter_feedback | id; weekly_review_id; user_id; verdict useful/not_accurate; created_at | Thiết kế |
| plans / capabilities / plan_capabilities | Khóa plan, lifecycle; khóa capability; mapping và policy quota tùy chọn | Future Tier 5; chưa chốt danh sách cột vật lý |
| subscriptions | user_id; tham chiếu provider/customer/subscription; trạng thái chuẩn hóa; cuối kỳ hiện tại; timestamps | Future Tier 5; chưa chốt tên/kiểu từng cột |
| billing_events | ID sự kiện provider; loại; thời điểm nhận/xử lý; kết quả xử lý | Future Tier 5; chưa chốt tên/kiểu từng cột |
| outbox_messages / inbox_messages | Thông điệp transaction và bản ghi chống xử lý lặp theo từng service | Pattern thiết kế; chưa có bảng trong migration hiện tại |

Yêu cầu thiết kế như export/delete engagement data, service ownership, AI jobs, notification attempts và deletion saga không được xem là class/bảng đã triển khai. Xem tài liệu Data Model để biết phạm vi dự kiến.

## 8. Cách cập nhật và giới hạn đối chiếu

Khi thay đổi dữ liệu, đối chiếu lần lượt: migration → JPA entity → domain → request/response → Zod → frontend. Cập nhật trường, kiểu, nullable/default, enum, FK/CHECK/index và mapping liên quan; ghi rõ phần thiết kế chưa triển khai. Không sửa lịch sử Supabase trong tài liệu thành schema core: hai bộ định nghĩa có khác biệt thực tế.

Các điểm cần nhớ khi tra cứu: model frontend Task/RemoteTask thiếu archived; response client tạo next action chỉ khai báo task; ApiError client dùng error trong khi Java dùng code; Java UpdateTask cho null như bỏ qua nhưng Zod updateTaskSchema không nhận null. Các khác biệt này được ghi nhận từ code hiện tại, chưa được sửa trong phạm vi tài liệu.

Đối chiếu này không introspect DB, không chạy migration, không kiểm chứng deployment hoặc dữ liệu thật. Cấu trúc JSONB facts, export unknown và profile unknown chưa đủ thông tin để liệt kê trường con chính xác. Model ML/dataset và cấu hình runtime không thuộc danh mục dữ liệu ứng dụng này.
