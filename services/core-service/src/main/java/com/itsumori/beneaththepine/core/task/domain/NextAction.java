package com.itsumori.beneaththepine.core.task.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record NextAction(
        UUID id,
        UUID taskId,
        String title,
        int minutes,
        Instant confirmedAt
) {
    public NextAction {
        Objects.requireNonNull(id, "id is required");
        Objects.requireNonNull(taskId, "taskId is required");
        Objects.requireNonNull(title, "title is required");
        Objects.requireNonNull(confirmedAt, "confirmedAt is required");
    }

    public static NextAction confirm(Task task, Instant now) {
        return new NextAction(UUID.randomUUID(), task.id(), task.title(), task.minutes(), now);
    }
}

