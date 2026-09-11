package com.itsumori.beneaththepine.core.task.application;

import com.itsumori.beneaththepine.core.task.domain.Task;
import com.itsumori.beneaththepine.core.task.domain.TaskNotFoundException;

import java.time.Clock;
import java.util.UUID;

public final class ArchiveTask {
    private final TaskRepository repository;
    private final Clock clock;

    public ArchiveTask(TaskRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public Task execute(UUID userId, UUID taskId) {
        Task task = repository.findByIdForUser(taskId, userId)
                .orElseThrow(TaskNotFoundException::new);
        task.archive(clock.instant());
        return repository.update(task);
    }
}
