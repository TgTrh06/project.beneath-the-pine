package com.itsumori.beneaththepine.core.task.infrastructure;

import com.itsumori.beneaththepine.core.task.domain.Task;
import com.itsumori.beneaththepine.core.task.domain.TaskStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tasks", schema = "core")
class TaskEntity {
    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 280)
    private String title;

    @Column(nullable = false)
    private int minutes;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "source_brain_dump_id")
    private UUID sourceBrainDumpId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected TaskEntity() {
    }

    static TaskEntity fromDomain(Task task) {
        TaskEntity entity = new TaskEntity();
        entity.apply(task);
        return entity;
    }

    void apply(Task task) {
        this.id = task.id();
        this.userId = task.userId();
        this.title = task.title();
        this.minutes = task.minutes();
        this.status = task.status().value();
        this.sourceBrainDumpId = task.sourceBrainDumpId();
        this.createdAt = task.createdAt();
        this.updatedAt = task.updatedAt();
    }

    Task toDomain() {
        return new Task(
                id,
                userId,
                title,
                minutes,
                TaskStatus.fromValue(status),
                sourceBrainDumpId,
                createdAt,
                updatedAt
        );
    }
}

