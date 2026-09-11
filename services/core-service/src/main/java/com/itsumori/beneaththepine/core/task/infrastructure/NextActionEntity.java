package com.itsumori.beneaththepine.core.task.infrastructure;

import com.itsumori.beneaththepine.core.task.domain.NextAction;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "next_actions", schema = "core")
class NextActionEntity {
    @Id
    private UUID id;

    @Column(name = "task_id", nullable = false, unique = true)
    private UUID taskId;

    @Column(nullable = false, length = 280)
    private String title;

    @Column(nullable = false)
    private int minutes;

    @Column(name = "confirmed_at", nullable = false)
    private Instant confirmedAt;

    protected NextActionEntity() {
    }

    static NextActionEntity fromDomain(NextAction nextAction) {
        NextActionEntity entity = new NextActionEntity();
        entity.id = nextAction.id();
        entity.taskId = nextAction.taskId();
        entity.title = nextAction.title();
        entity.minutes = nextAction.minutes();
        entity.confirmedAt = nextAction.confirmedAt();
        return entity;
    }
}

