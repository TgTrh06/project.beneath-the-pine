package com.itsumori.beneaththepine.core.task.application;

import com.itsumori.beneaththepine.core.task.domain.InvalidTaskException;
import com.itsumori.beneaththepine.core.task.domain.Task;
import com.itsumori.beneaththepine.core.task.domain.TaskNotFoundException;
import com.itsumori.beneaththepine.core.task.domain.TaskStatus;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

public final class UpdateTask {
    private final TaskRepository repository;
    private final Clock clock;

    public UpdateTask(TaskRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public Task execute(Command command) {
        if (command.title() == null && command.minutes() == null && command.status() == null) {
            throw new InvalidTaskException("At least one task field must be provided");
        }

        Task task = repository.findByIdForUser(command.taskId(), command.userId())
                .orElseThrow(TaskNotFoundException::new);
        Instant now = clock.instant();

        if (command.title() != null) {
            task.rename(command.title(), now);
        }
        if (command.minutes() != null) {
            task.changeMinutes(command.minutes(), now);
        }
        if (command.status() != null) {
            task.changeStatus(command.status(), now);
        }

        return repository.update(task);
    }

    public record Command(
            UUID userId,
            UUID taskId,
            String title,
            Integer minutes,
            TaskStatus status
    ) {
    }
}

