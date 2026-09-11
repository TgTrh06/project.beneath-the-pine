package com.itsumori.beneaththepine.core.task.application;

import com.itsumori.beneaththepine.core.task.domain.NextAction;
import com.itsumori.beneaththepine.core.task.domain.Task;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

public final class CreateNextAction {
    private final TaskRepository repository;
    private final Clock clock;

    public CreateNextAction(TaskRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public Result execute(Command command) {
        Instant now = clock.instant();
        Task task = Task.create(
                command.userId(),
                command.title(),
                command.minutes(),
                command.sourceBrainDumpId(),
                now
        );
        NextAction nextAction = NextAction.confirm(task, now);
        repository.createConfirmedAction(task, nextAction);
        return new Result(task, nextAction);
    }

    public record Command(UUID userId, String title, int minutes, UUID sourceBrainDumpId) {
    }

    public record Result(Task task, NextAction nextAction) {
    }
}

