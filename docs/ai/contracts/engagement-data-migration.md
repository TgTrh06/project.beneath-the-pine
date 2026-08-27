# Engagement Data Migration Plan

## Additive migration

Create `engagement_preferences`, `reminder_slots`, `focus_seeds` and `weekly_letter_feedback`; add indexes described in `04-engineering/data-model.md`. Do not alter/remove existing tables or enum values in this slice.

## RLS

Enable RLS on each table. Policies must compare `user_id` to `auth.uid()` for select/insert/update/delete; feedback ownership is additionally constrained by the referenced review user.

## Migration sequence

1. Create tables, foreign keys, check constraints and indexes.
2. Enable RLS and policies.
3. Deploy API that tolerates absent preference rows with safe defaults.
4. Backfill nothing: preferences and seeds are created on user action.
5. Release UI after API compatibility is verified.

## Rollback and data rights

Forward-fix schema issues; do not drop user data in rollback. Extend account export/delete transaction to include all server-side engagement rows. Local theme/audio preferences are not migrated or exported.
