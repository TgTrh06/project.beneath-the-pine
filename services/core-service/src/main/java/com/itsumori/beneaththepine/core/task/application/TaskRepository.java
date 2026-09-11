package com.itsumori.beneaththepine.core.task.application;

import com.itsumori.beneaththepine.core.task.domain.NextAction;
import com.itsumori.beneaththepine.core.task.domain.Task;
import com.itsumori.beneaththepine.core.task.domain.TaskStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository {
    void createConfirmedAction(Task task, NextAction nextAction);

    Optional<Task> findByIdForUser(UUID taskId, UUID userId);

    List<Task> listForUser(UUID userId, Optional<TaskStatus> status, int limit);

    Task update(Task task);
}

