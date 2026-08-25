import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createDatabase, type Database } from "../db/client.js";
import { adminEmails, env } from "../env.js";
import { DrizzleAnalyticsRepository } from "../modules/analytics/infrastructure/DrizzleAnalyticsRepository.js";
import { ConsumeAiQuota } from "../modules/analytics/application/use-cases/ConsumeAiQuota.js";
import { GetQuotaSnapshot } from "../modules/analytics/application/use-cases/GetQuotaSnapshot.js";
import { RecordProductEvent } from "../modules/analytics/application/use-cases/RecordProductEvent.js";
import { AnalyticsController } from "../modules/analytics/presentation/AnalyticsController.js";
import { SupabaseAuthIdentityProvider } from "../modules/auth/infrastructure/SupabaseAuthIdentityProvider.js";
import { ApproveWaitlistMember } from "../modules/beta/application/use-cases/ApproveWaitlistMember.js";
import { JoinWaitlist } from "../modules/beta/application/use-cases/JoinWaitlist.js";
import { DrizzleWaitlistRepository } from "../modules/beta/infrastructure/DrizzleWaitlistRepository.js";
import { BetaController } from "../modules/beta/presentation/BetaController.js";
import { CreateBrainDump } from "../modules/capture/application/use-cases/CreateBrainDump.js";
import { CreateCheckin } from "../modules/capture/application/use-cases/CreateCheckin.js";
import { CreateWeeklyReview } from "../modules/capture/application/use-cases/CreateWeeklyReview.js";
import { ExportPrivateData } from "../modules/capture/application/use-cases/ExportPrivateData.js";
import { HelpMeStart } from "../modules/capture/application/use-cases/HelpMeStart.js";
import { DrizzleCaptureRepository } from "../modules/capture/infrastructure/DrizzleCaptureRepository.js";
import { createGrowthAssistant } from "../modules/capture/infrastructure/createGrowthAssistant.js";
import { CaptureController } from "../modules/capture/presentation/CaptureController.js";
import { DrizzleResearchRepository } from "../modules/research/infrastructure/DrizzleResearchRepository.js";
import { ResearchController } from "../modules/research/presentation/ResearchController.js";
import { CompleteHabit } from "../modules/habit/application/use-cases/CompleteHabit.js";
import { CreateHabit } from "../modules/habit/application/use-cases/CreateHabit.js";
import { DrizzleHabitRepository } from "../modules/habit/infrastructure/repositories/DrizzleHabitRepository.js";
import { HabitController } from "../modules/habit/presentation/HabitController.js";
import { FinishFocusSession } from "../modules/task/application/use-cases/FinishFocusSession.js";
import { CreateTask } from "../modules/task/application/use-cases/CreateTask.js";
import { StartFocusSession } from "../modules/task/application/use-cases/StartFocusSession.js";
import { DrizzleTaskRepository } from "../modules/task/infrastructure/repositories/DrizzleTaskRepository.js";
import { TaskController } from "../modules/task/presentation/TaskController.js";
import { AuthorizeBetaMember } from "../modules/user/application/use-cases/AuthorizeBetaMember.js";
import { BootstrapUser } from "../modules/user/application/use-cases/BootstrapUser.js";
import { DeleteAccount } from "../modules/user/application/use-cases/DeleteAccount.js";
import { ExportAccountData } from "../modules/user/application/use-cases/ExportAccountData.js";
import { RecordConsent } from "../modules/user/application/use-cases/RecordConsent.js";
import { DrizzleUserRepository } from "../modules/user/infrastructure/DrizzleUserRepository.js";
import { AccountController } from "../modules/user/presentation/AccountController.js";
import { BootstrapController } from "../modules/user/presentation/BootstrapController.js";
import { UserController } from "../modules/user/presentation/UserController.js";
import { AesGcmContentCipher } from "../shared/infrastructure/security/AesGcmContentCipher.js";
import { SupabaseClientFactory } from "../shared/infrastructure/supabase/SupabaseClientFactory.js";
import { currentWeekStart } from "../shared/utils/week.js";

type Controllers = ReturnType<typeof compose>;
type MemberHandler = (request: FastifyRequest, reply: FastifyReply, user: Awaited<ReturnType<Controllers["authorize"]["execute"]>>) => Promise<unknown>;
const token = (request: FastifyRequest): string | undefined => request.headers.authorization?.startsWith("Bearer ") ? request.headers.authorization.slice(7) : undefined;

function compose(db: Database) {
  const users = new DrizzleUserRepository(db); const tasks = new DrizzleTaskRepository(db); const habits = new DrizzleHabitRepository(db); const analytics = new DrizzleAnalyticsRepository(db); const captures = new DrizzleCaptureRepository(db); const research = new DrizzleResearchRepository(db); const identities = new SupabaseAuthIdentityProvider(new SupabaseClientFactory()); const cipher = new AesGcmContentCipher(); const weekStart = () => currentWeekStart(); const quota = new ConsumeAiQuota(analytics, weekStart); const events = new RecordProductEvent(analytics); const getQuota = new GetQuotaSnapshot(analytics, weekStart); const assistant = createGrowthAssistant();
  return {
    authorize: new AuthorizeBetaMember(identities, users, adminEmails),
    beta: new BetaController(new JoinWaitlist(new DrizzleWaitlistRepository(db)), new ApproveWaitlistMember(new DrizzleWaitlistRepository(db), identities, users, env.WEB_ORIGIN), new DrizzleWaitlistRepository(db)),
    user: new UserController(new RecordConsent(users)), bootstrap: new BootstrapController(new BootstrapUser(users, tasks, habits, analytics, weekStart)), account: new AccountController(new DeleteAccount(users), new ExportAccountData(users, tasks, habits, new ExportPrivateData(captures, cipher))),
    task: new TaskController(new CreateTask(tasks), new StartFocusSession(tasks, tasks), new FinishFocusSession(tasks, tasks)), habit: new HabitController(new CreateHabit(habits), new CompleteHabit(habits, () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }))),
    capture: new CaptureController(new CreateBrainDump(captures, cipher, assistant, quota, events, () => new Date()), new HelpMeStart(tasks, captures, assistant, quota), new CreateCheckin(captures, cipher), new CreateWeeklyReview(captures, assistant, quota, weekStart), captures, getQuota),
    research: new ResearchController(research),
    analytics: new AnalyticsController(events),
  };
}

export async function registerApiRoutes(app: FastifyInstance): Promise<void> {
  const db = createDatabase();
  app.get("/health", async () => ({ status: "ok", storage: db ? "configured" : "not_configured" }));
  if (!db) { app.all("/api/v1/*", async (_request, reply) => reply.code(503).send({ error: "SERVICE_NOT_CONFIGURED", message: "API cần Supabase local hoặc cloud để chạy." })); return; }
  const controllers = compose(db);
  const member = (handler: MemberHandler) => async (request: FastifyRequest, reply: FastifyReply) => handler(request, reply, await controllers.authorize.execute(token(request)));
  app.post("/api/v1/waitlist", (request, reply) => controllers.beta.join(request, reply));
  app.get("/api/v1/me/bootstrap", member((request, reply, user) => controllers.bootstrap.get(request, reply, user)));
  app.post("/api/v1/consents", member((request, reply, user) => controllers.user.consent(request, reply, user)));
  app.post("/api/v1/brain-dumps", member((request, reply, user) => controllers.capture.brainDump(request, reply, user)));
  app.post("/api/v1/next-actions", member((request, reply, user) => controllers.task.createNextAction(request, reply, user)));
  app.post("/api/v1/help-me-start", member((request, reply, user) => controllers.capture.helpStart(request, reply, user)));
  app.post("/api/v1/focus-sessions", member((request, reply, user) => controllers.task.startSession(request, reply, user)));
  app.patch("/api/v1/focus-sessions/:id", member((request, reply, user) => controllers.task.finishSession(request, reply, user)));
  app.post("/api/v1/habits", member((request, reply, user) => controllers.habit.create(request, reply, user)));
  app.put("/api/v1/habits/:id/completion", member((request, reply, user) => controllers.habit.complete(request, reply, user)));
  app.post("/api/v1/checkins", member((request, reply, user) => controllers.capture.checkin(request, reply, user)));
  app.post("/api/v1/weekly-reviews", member((request, reply, user) => controllers.capture.weeklyReview(request, reply, user)));
  app.post("/api/v1/experiments/:id/approve", member((request, reply, user) => controllers.capture.approveExperiment(request, reply, user)));
  app.post("/api/v1/events", member((request, reply, user) => controllers.analytics.event(request, reply, user)));
  app.get("/api/v1/study", member((request, reply, user) => controllers.research.get(request, reply, user)));
  app.post("/api/v1/study/enroll", member((request, reply, user) => controllers.research.enroll(request, reply, user)));
  app.post("/api/v1/study/sessions", member((request, reply, user) => controllers.research.begin(request, reply, user)));
  app.post("/api/v1/study/sessions/:id/start", member((request, reply, user) => controllers.research.markStarted(request, reply, user)));
  app.patch("/api/v1/study/sessions/:id", member((request, reply, user) => controllers.research.complete(request, reply, user)));
  app.delete("/api/v1/study", member((request, reply, user) => controllers.research.withdraw(request, reply, user)));
  app.get("/api/v1/export", member((request, reply, user) => controllers.account.export(request, reply, user)));
  app.delete("/api/v1/account", member((request, reply, user) => controllers.account.delete(request, reply, user)));
  app.get("/api/v1/admin/waitlist", member((request, reply, user) => controllers.beta.list(request, reply, user)));
  app.post("/api/v1/admin/waitlist/:id/approve", member((request, reply, user) => controllers.beta.approve(request, reply, user)));
}
