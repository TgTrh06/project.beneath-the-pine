package com.itsumori.beneaththepine.core.task.application;

import com.itsumori.beneaththepine.core.task.domain.Task;
import com.itsumori.beneaththepine.core.task.domain.TaskStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public final class ListTasks {
    private final TaskRepository repository;

    public ListTasks(TaskRepository repository) {
        this.repository = repository;
    }

    public List<Task> execute(UUID userId, Optional<TaskStatus> status, int limit) {
        return repository.listForUser(userId, status, limit);
    }
}

