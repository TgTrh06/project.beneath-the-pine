package com.itsumori.beneaththepine.core.task.application;

import com.itsumori.beneaththepine.core.task.domain.NextAction;
import com.itsumori.beneaththepine.core.task.domain.Task;
import com.itsumori.beneaththepine.core.task.domain.TaskNotFoundException;
import com.itsumori.beneaththepine.core.task.domain.TaskStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TaskUseCasesTest {
    private static final Instant NOW = Instant.parse("2026-09-10T00:00:00Z");
    private static final Clock CLOCK = Clock.fixed(NOW, ZoneOffset.UTC);

    private InMemoryTaskRepository repository;

    @BeforeEach
    void setUp() {
        repository = new InMemoryTaskRepository();
    }

    @Test
    void createsTheTaskAndConfirmationAsOneUseCase() {
        UUID userId = UUID.randomUUID();
        CreateNextAction.Result result = new CreateNextAction(repository, CLOCK).execute(
                new CreateNextAction.Command(userId, "Open the notebook", 5, null)
        );

        assertThat(repository.tasks).containsKey(result.task().id());
        assertThat(repository.nextActions).singleElement()
                .extracting(NextAction::taskId)
                .isEqualTo(result.task().id());
    }

    @Test
    void hidesAnotherUsersTaskAsNotFound() {
        UUID ownerId = UUID.randomUUID();
        UUID visitorId = UUID.randomUUID();
        Task task = Task.create(ownerId, "Open the notebook", 5, null, NOW);
        repository.tasks.put(task.id(), task);

        assertThatThrownBy(() -> new GetTask(repository).execute(visitorId, task.id()))
                .isInstanceOf(TaskNotFoundException.class);
    }

    @Test
    void updatesAndArchivesThroughDedicatedUseCases() {
        UUID userId = UUID.randomUUID();
        Task task = Task.create(userId, "Open the notebook", 5, null, NOW.minusSeconds(60));
        repository.tasks.put(task.id(), task);

        Task updated = new UpdateTask(repository, CLOCK).execute(new UpdateTask.Command(
                userId,
                task.id(),
                "Write one line",
                3,
                TaskStatus.DONE
        ));
        Task archived = new ArchiveTask(repository, CLOCK).execute(userId, task.id());

        assertThat(updated.title()).isEqualTo("Write one line");
        assertThat(updated.minutes()).isEqualTo(3);
        assertThat(archived.status()).isEqualTo(TaskStatus.ARCHIVED);
    }

    private static final class InMemoryTaskRepository implements TaskRepository {
        private final Map<UUID, Task> tasks = new LinkedHashMap<>();
        private final List<NextAction> nextActions = new ArrayList<>();

        @Override
        public void createConfirmedAction(Task task, NextAction nextAction) {
            tasks.put(task.id(), task);
            nextActions.add(nextAction);
        }

        @Override
        public Optional<Task> findByIdForUser(UUID taskId, UUID userId) {
            return Optional.ofNullable(tasks.get(taskId)).filter(task -> task.userId().equals(userId));
        }

        @Override
        public List<Task> listForUser(UUID userId, Optional<TaskStatus> status, int limit) {
            return tasks.values().stream()
                    .filter(task -> task.userId().equals(userId))
                    .filter(task -> status.map(value -> task.status() == value).orElse(true))
                    .limit(limit)
                    .toList();
        }

        @Override
        public Task update(Task task) {
            tasks.put(task.id(), task);
            return task;
        }
    }
}
