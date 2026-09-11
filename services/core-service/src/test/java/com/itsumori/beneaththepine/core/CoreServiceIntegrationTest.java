package com.itsumori.beneaththepine.core;

import com.itsumori.beneaththepine.core.shared.logging.CorrelationIdFilter;
import com.itsumori.beneaththepine.core.shared.security.AccountPrincipal;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class CoreServiceIntegrationTest {

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine")
            .withDatabaseName("beneath_pine")
            .withUsername("beneath_pine")
            .withPassword("beneath_pine");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Autowired
    WebApplicationContext applicationContext;

    @Autowired
    CorrelationIdFilter correlationIdFilter;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    CsrfTokenRepository csrfTokenRepository;

    @Autowired
    CsrfTokenRequestHandler csrfTokenRequestHandler;

    MockMvc mockMvc;

    @BeforeEach
    void setUpMockMvc() {
        mockMvc = MockMvcBuilders.webAppContextSetup(applicationContext)
                .addFilters(correlationIdFilter)
                .apply(springSecurity())
                .build();
        jdbcTemplate.update("delete from core.next_actions");
        jdbcTemplate.update("delete from core.tasks");
        jdbcTemplate.update("delete from core.accounts");
    }

    @Test
    void startsWithFlywayManagedCoreSchema() {
        Boolean coreSchemaExists = jdbcTemplate.queryForObject(
                "select exists(select 1 from information_schema.schemata where schema_name = 'core')",
                Boolean.class
        );
        Integer migrationCount = jdbcTemplate.queryForObject(
                "select count(*) from flyway_schema_history where success",
                Integer.class
        );

        assertThat(coreSchemaExists).isTrue();
        assertThat(migrationCount).isEqualTo(3);
    }

    @Test
    void rejectsUnauthenticatedRequestsWithAStableErrorEnvelope() throws Exception {
        mockMvc.perform(get("/api/v1/system/auth-check")
                        .header("X-Request-ID", "test-request-123"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("X-Request-ID", "test-request-123"))
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
                .andExpect(jsonPath("$.message").value("Authentication is required."))
                .andExpect(jsonPath("$.requestId").value("test-request-123"));
    }

    @Test
    void exposesTheAuthenticatedAccount() throws Exception {
        UUID userId = UUID.randomUUID();
        mockMvc.perform(get("/api/v1/system/auth-check")
                        .with(authenticated(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.subject").value(userId.toString()))
                .andExpect(jsonPath("$.email").value(emailFor(userId)));
    }

    @Test
    void registersAnAccountWithBcryptAndCreatesASession() throws Exception {
        var result = mockMvc.perform(post("/api/v1/auth/register")
                        .with(validCsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "  New.User@Example.com ", "password": "a-secure-passphrase"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.user.email").value("new.user@example.com"))
                .andExpect(jsonPath("$.user.id").isNotEmpty())
                .andExpect(jsonPath("$.csrfToken").isNotEmpty())
                .andReturn();

        String passwordHash = jdbcTemplate.queryForObject(
                "select password_hash from core.accounts where email = 'new.user@example.com'",
                String.class
        );
        assertThat(passwordHash).isNotEqualTo("a-secure-passphrase");
        assertThat(passwordEncoder.matches("a-secure-passphrase", passwordHash)).isTrue();

        mockMvc.perform(get("/api/v1/auth/session")
                        .session((MockHttpSession) result.getRequest().getSession(false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.user.email").value("new.user@example.com"));
    }

    @Test
    void acceptsTheRotatedCsrfCookieAndResponseTokenOnTheNextMutation() throws Exception {
        var anonymousResult = mockMvc.perform(get("/api/v1/auth/session"))
                .andExpect(status().isOk())
                .andReturn();
        String anonymousCsrfToken = objectMapper.readTree(anonymousResult.getResponse().getContentAsString())
                .get("csrfToken")
                .asText();
        Cookie anonymousCsrfCookie = csrfCookie(anonymousResult.getResponse());

        var registrationResult = mockMvc.perform(post("/api/v1/auth/register")
                        .cookie(anonymousCsrfCookie)
                        .header("X-XSRF-TOKEN", anonymousCsrfToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "csrf@example.com", "password": "a-secure-passphrase"}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        String rotatedCsrfToken = objectMapper.readTree(registrationResult.getResponse().getContentAsString())
                .get("csrfToken")
                .asText();
        Cookie rotatedCsrfCookie = csrfCookie(registrationResult.getResponse());
        MockHttpSession session = (MockHttpSession) registrationResult.getRequest().getSession(false);

        mockMvc.perform(post("/api/v1/next-actions")
                        .session(session)
                        .cookie(rotatedCsrfCookie)
                        .header("X-XSRF-TOKEN", rotatedCsrfToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Verify CSRF handshake", "minutes": 3}
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void rejectsInvalidCredentialsWithAGenericError() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .with(validCsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "missing@example.com", "password": "a-wrong-passphrase"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("The email or password is incorrect."));
    }

    @Test
    void rotatesTheSessionOnLoginAndInvalidatesItOnLogout() throws Exception {
        UUID userId = UUID.randomUUID();
        ensureAccount(userId);
        MockHttpSession anonymousSession = new MockHttpSession();
        String sessionIdBeforeLogin = anonymousSession.getId();

        var loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .session(anonymousSession)
                        .with(validCsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "a-secure-passphrase"}
                                """.formatted(emailFor(userId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").value(userId.toString()))
                .andReturn();

        MockHttpSession authenticatedSession = (MockHttpSession) loginResult.getRequest().getSession(false);
        assertThat(authenticatedSession.getId()).isNotEqualTo(sessionIdBeforeLogin);

        mockMvc.perform(post("/api/v1/auth/logout")
                        .session(authenticatedSession)
                        .with(validCsrf()))
                .andExpect(status().isNoContent());
        assertThat(authenticatedSession.isInvalid()).isTrue();
    }

    @Test
    void rejectsStateChangingRequestsWithoutCsrf() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "new@example.com", "password": "a-secure-passphrase"}
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void rejectsPasswordsThatExceedBcryptsUtf8InputLimit() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .with(validCsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "new@example.com", "password": "ááááááááááááááááááááááááááááááááááááá"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void exposesLivenessWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void createsATaskAndConfirmedNextActionAtomically() throws Exception {
        UUID userId = UUID.randomUUID();
        ensureAccount(userId);

        mockMvc.perform(post("/api/v1/next-actions")
                        .with(authenticated(userId))
                        .with(validCsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "  Open the notebook  ",
                                  "minutes": 5
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.task.userId").value(userId.toString()))
                .andExpect(jsonPath("$.task.title").value("Open the notebook"))
                .andExpect(jsonPath("$.task.minutes").value(5))
                .andExpect(jsonPath("$.task.status").value("ready"))
                .andExpect(jsonPath("$.nextAction.taskId").isNotEmpty())
                .andExpect(jsonPath("$.nextAction.confirmedAt").isNotEmpty());

        assertThat(jdbcTemplate.queryForObject("select count(*) from core.tasks", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("select count(*) from core.next_actions", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("""
                select count(*)
                from core.next_actions next_action
                join core.tasks task on task.id = next_action.task_id
                """, Integer.class)).isEqualTo(1);
    }

    @Test
    void protectsTaskWritesAndValidatesTheRequest() throws Exception {
        mockMvc.perform(post("/api/v1/next-actions")
                        .with(validCsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Open the notebook", "minutes": 5}
                                """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/next-actions")
                        .with(authenticated(UUID.randomUUID()))
                        .with(validCsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "x", "minutes": 20}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void listsOnlyTheAuthenticatedUsersTasks() throws Exception {
        UUID ownerId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UUID ownerTaskId = createTask(ownerId, "Owner task");
        createTask(otherUserId, "Other task");

        mockMvc.perform(get("/api/v1/tasks")
                        .param("status", "ready")
                        .param("limit", "10")
                        .with(authenticated(ownerId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tasks.length()").value(1))
                .andExpect(jsonPath("$.tasks[0].id").value(ownerTaskId.toString()))
                .andExpect(jsonPath("$.tasks[0].userId").value(ownerId.toString()));
    }

    @Test
    void hidesAnotherUsersTaskBehindNotFound() throws Exception {
        UUID ownerId = UUID.randomUUID();
        UUID visitorId = UUID.randomUUID();
        UUID taskId = createTask(ownerId, "Owner task");

        mockMvc.perform(get("/api/v1/tasks/{taskId}", taskId)
                        .with(authenticated(ownerId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(taskId.toString()));

        mockMvc.perform(get("/api/v1/tasks/{taskId}", taskId)
                        .with(authenticated(visitorId)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TASK_NOT_FOUND"));
    }

    @Test
    void updatesThenArchivesATaskAndTreatsArchiveAsTerminal() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID taskId = createTask(userId, "Open the notebook");

        mockMvc.perform(patch("/api/v1/tasks/{taskId}", taskId)
                        .with(authenticated(userId))
                        .with(validCsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Write one line", "minutes": 3, "status": "done"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Write one line"))
                .andExpect(jsonPath("$.minutes").value(3))
                .andExpect(jsonPath("$.status").value("done"));

        mockMvc.perform(post("/api/v1/tasks/{taskId}/archive", taskId)
                        .with(authenticated(userId))
                        .with(validCsrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("archived"));

        mockMvc.perform(patch("/api/v1/tasks/{taskId}", taskId)
                        .with(authenticated(userId))
                        .with(validCsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status": "ready"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TASK_ARCHIVED"));
    }

    @Test
    void rejectsInvalidQueryParametersWithAClientError() throws Exception {
        UUID userId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/tasks")
                        .param("limit", "101")
                        .with(authenticated(userId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        mockMvc.perform(patch("/api/v1/tasks/{taskId}", UUID.randomUUID())
                        .with(authenticated(userId))
                        .with(validCsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void enforcesTaskConstraintsInPostgreSql() {
        UUID userId = UUID.randomUUID();
        ensureAccount(userId);
        assertThatThrownBy(() -> jdbcTemplate.update("""
                        insert into core.tasks
                            (id, user_id, title, minutes, status, created_at, updated_at)
                        values (?, ?, ?, ?, ?, ?, ?)
                        """,
                userId,
                UUID.randomUUID(),
                "Invalid minutes",
                11,
                "ready",
                Timestamp.from(Instant.now()),
                Timestamp.from(Instant.now())
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    private UUID createTask(UUID userId, String title) throws Exception {
        ensureAccount(userId);
        mockMvc.perform(post("/api/v1/next-actions")
                        .with(authenticated(userId))
                        .with(validCsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "%s", "minutes": 5}
                                """.formatted(title)))
                .andExpect(status().isCreated());

        return jdbcTemplate.queryForObject(
                "select id from core.tasks where user_id = ? and title = ?",
                UUID.class,
                userId,
                title
        );
    }

    private RequestPostProcessor authenticated(UUID userId) {
        return user(new AccountPrincipal(userId, emailFor(userId), null, true));
    }

    private RequestPostProcessor validCsrf() {
        return request -> {
            CsrfToken token = csrfTokenRepository.generateToken(request);
            csrfTokenRequestHandler.handle(request, new MockHttpServletResponse(), () -> token);
            CsrfToken maskedToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            request.setCookies(new Cookie("XSRF-TOKEN", token.getToken()));
            request.addHeader(token.getHeaderName(), maskedToken.getToken());
            return request;
        };
    }

    private Cookie csrfCookie(MockHttpServletResponse response) {
        return response.getHeaders(HttpHeaders.SET_COOKIE).stream()
                .filter(value -> value.startsWith("XSRF-TOKEN="))
                .map(value -> value.substring("XSRF-TOKEN=".length()).split(";", 2)[0])
                .filter(value -> !value.isBlank())
                .reduce((previous, current) -> current)
                .map(value -> new Cookie("XSRF-TOKEN", value))
                .orElseThrow(() -> new AssertionError(
                        "Response did not set a CSRF cookie: " + response.getHeaderNames().stream()
                                .map(name -> name + "=" + response.getHeaders(name))
                                .toList() + "; body="
                                + new String(response.getContentAsByteArray(), StandardCharsets.UTF_8)
                ));
    }

    private void ensureAccount(UUID userId) {
        jdbcTemplate.update("""
                        insert into core.accounts (id, email, password_hash, enabled, created_at, updated_at)
                        values (?, ?, ?, true, now(), now())
                        on conflict (id) do nothing
                        """,
                userId,
                emailFor(userId),
                passwordEncoder.encode("a-secure-passphrase")
        );
    }

    private String emailFor(UUID userId) {
        return userId + "@example.test";
    }
}
