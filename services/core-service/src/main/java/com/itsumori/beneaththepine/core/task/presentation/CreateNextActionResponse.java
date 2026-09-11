package com.itsumori.beneaththepine.core.task.presentation;

import com.itsumori.beneaththepine.core.task.application.CreateNextAction;

record CreateNextActionResponse(
        TaskResponse task,
        ConfirmedNextActionResponse nextAction
) {
    static CreateNextActionResponse from(CreateNextAction.Result result) {
        return new CreateNextActionResponse(
                TaskResponse.from(result.task()),
                ConfirmedNextActionResponse.from(result.nextAction())
        );
    }
}

