package com.itsumori.beneaththepine.core.task.application;

import com.itsumori.beneaththepine.core.task.domain.Task;
import com.itsumori.beneaththepine.core.task.domain.TaskNotFoundException;

import java.util.UUID;

public final class GetTask {
    private final TaskRepository repository;

    public GetTask(TaskRepository repository) {
        this.repository = repository;
    }

    public Task execute(UUID userId, UUID taskId) {
        return repository.findByIdForUser(taskId, userId)
                .orElseThrow(TaskNotFoundException::new);
    }
}

