-- The application writes through the server-side API. These policies are a second
-- boundary in case a client obtains direct PostgREST access with an end-user JWT.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_dumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_owner" ON profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "membership_owner_read" ON beta_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "role_owner_read" ON roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "consent_owner" ON consents FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "brain_dump_owner" ON brain_dumps FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "task_owner" ON tasks FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "focus_owner" ON focus_sessions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "reset_owner" ON daily_resets FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "habit_owner" ON habits FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "completion_owner" ON habit_completions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "checkin_owner" ON checkins FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "review_owner" ON weekly_reviews FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "experiment_owner" ON experiments FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "usage_owner_read" ON ai_usage FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "event_owner" ON product_events FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "next_action_task_owner" ON next_actions FOR ALL USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = next_actions.task_id AND tasks.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = next_actions.task_id AND tasks.user_id = auth.uid()));
