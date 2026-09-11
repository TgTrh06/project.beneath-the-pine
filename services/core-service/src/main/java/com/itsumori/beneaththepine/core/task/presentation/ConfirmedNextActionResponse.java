package com.itsumori.beneaththepine.core.task.presentation;

import com.itsumori.beneaththepine.core.task.domain.NextAction;

import java.time.Instant;
import java.util.UUID;

record ConfirmedNextActionResponse(
        UUID taskId,
        String title,
        int minutes,
        Instant confirmedAt
) {
    static ConfirmedNextActionResponse from(NextAction nextAction) {
        return new ConfirmedNextActionResponse(
                nextAction.taskId(),
                nextAction.title(),
                nextAction.minutes(),
                nextAction.confirmedAt()
        );
    }
}

