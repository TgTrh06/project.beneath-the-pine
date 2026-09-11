package com.itsumori.beneaththepine.core.task.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public final class Task {
    private final UUID id;
    private final UUID userId;
    private String title;
    private int minutes;
    private TaskStatus status;
    private final UUID sourceBrainDumpId;
    private final Instant createdAt;
    private Instant updatedAt;

    public Task(
            UUID id,
            UUID userId,
            String title,
            int minutes,
            TaskStatus status,
            UUID sourceBrainDumpId,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = Objects.requireNonNull(id, "id is required");
        this.userId = Objects.requireNonNull(userId, "userId is required");
        this.title = normalizeTitle(title);
        this.minutes = validateMinutes(minutes);
        this.status = Objects.requireNonNull(status, "status is required");
        this.sourceBrainDumpId = sourceBrainDumpId;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt is required");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt is required");
    }

    public static Task create(
            UUID userId,
            String title,
            int minutes,
            UUID sourceBrainDumpId,
            Instant now
    ) {
        return new Task(
                UUID.randomUUID(),
                userId,
                title,
                minutes,
                TaskStatus.READY,
                sourceBrainDumpId,
                now,
                now
        );
    }

    public void rename(String title, Instant now) {
        ensureMutable();
        this.title = normalizeTitle(title);
        this.updatedAt = Objects.requireNonNull(now, "now is required");
    }

    public void changeMinutes(int minutes, Instant now) {
        ensureMutable();
        this.minutes = validateMinutes(minutes);
        this.updatedAt = Objects.requireNonNull(now, "now is required");
    }

    public void changeStatus(TaskStatus status, Instant now) {
        ensureMutable();
        if (status == TaskStatus.ARCHIVED) {
            throw new InvalidTaskException("Use the archive operation to archive a task");
        }
        this.status = Objects.requireNonNull(status, "status is required");
        this.updatedAt = Objects.requireNonNull(now, "now is required");
    }

    public void archive(Instant now) {
        ensureMutable();
        this.status = TaskStatus.ARCHIVED;
        this.updatedAt = Objects.requireNonNull(now, "now is required");
    }

    private void ensureMutable() {
        if (status == TaskStatus.ARCHIVED) {
            throw new ArchivedTaskException();
        }
    }

    private static String normalizeTitle(String title) {
        if (title == null) {
            throw new InvalidTaskException("Task title is required");
        }
        String normalized = title.trim();
        if (normalized.length() < 2 || normalized.length() > 280) {
            throw new InvalidTaskException("Task title must contain between 2 and 280 characters");
        }
        return normalized;
    }

    private static int validateMinutes(int minutes) {
        if (minutes < 1 || minutes > 10) {
            throw new InvalidTaskException("Task minutes must be between 1 and 10");
        }
        return minutes;
    }

    public UUID id() {
        return id;
    }

    public UUID userId() {
        return userId;
    }

    public String title() {
        return title;
    }

    public int minutes() {
        return minutes;
    }

    public TaskStatus status() {
        return status;
    }

    public UUID sourceBrainDumpId() {
        return sourceBrainDumpId;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }
}

