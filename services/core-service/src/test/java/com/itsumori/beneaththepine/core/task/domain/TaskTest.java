package com.itsumori.beneaththepine.core.task.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TaskTest {
    private static final Instant NOW = Instant.parse("2026-09-10T00:00:00Z");

    @Test
    void createsAReadyTaskWithNormalizedTitle() {
        Task task = Task.create(UUID.randomUUID(), "  Open the notebook  ", 5, null, NOW);

        assertThat(task.title()).isEqualTo("Open the notebook");
        assertThat(task.minutes()).isEqualTo(5);
        assertThat(task.status()).isEqualTo(TaskStatus.READY);
        assertThat(task.createdAt()).isEqualTo(NOW);
    }

    @Test
    void rejectsTasksOutsideTheTinyActionBoundary() {
        UUID userId = UUID.randomUUID();

        assertThatThrownBy(() -> Task.create(userId, "Valid title", 0, null, NOW))
                .isInstanceOf(InvalidTaskException.class);
        assertThatThrownBy(() -> Task.create(userId, " ", 5, null, NOW))
                .isInstanceOf(InvalidTaskException.class);
    }

    @Test
    void preventsChangesAfterArchive() {
        Task task = Task.create(UUID.randomUUID(), "Open the notebook", 5, null, NOW);
        task.archive(NOW.plusSeconds(60));

        assertThat(task.status()).isEqualTo(TaskStatus.ARCHIVED);
        assertThatThrownBy(() -> task.rename("Choose a page", NOW.plusSeconds(120)))
                .isInstanceOf(ArchivedTaskException.class);
    }

    @Test
    void requiresTheDedicatedArchiveOperation() {
        Task task = Task.create(UUID.randomUUID(), "Open the notebook", 5, null, NOW);

        assertThatThrownBy(() -> task.changeStatus(TaskStatus.ARCHIVED, NOW.plusSeconds(60)))
                .isInstanceOf(InvalidTaskException.class);
    }
}

