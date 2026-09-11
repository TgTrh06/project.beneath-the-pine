package com.itsumori.beneaththepine.core.task.domain;

public final class TaskNotFoundException extends RuntimeException {
    public TaskNotFoundException() {
        super("Task not found");
    }
}

