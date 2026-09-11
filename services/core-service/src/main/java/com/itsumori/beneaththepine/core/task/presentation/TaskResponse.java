package com.itsumori.beneaththepine.core.task.presentation;

import com.itsumori.beneaththepine.core.task.domain.Task;

import java.time.Instant;
import java.util.UUID;

record TaskResponse(
        UUID id,
        UUID userId,
        String title,
        int minutes,
        String status,
        UUID sourceBrainDumpId,
        Instant createdAt,
        Instant updatedAt
) {
    static TaskResponse from(Task task) {
        return new TaskResponse(
                task.id(),
                task.userId(),
                task.title(),
                task.minutes(),
                task.status().value(),
                task.sourceBrainDumpId(),
                task.createdAt(),
                task.updatedAt()
        );
    }
}

