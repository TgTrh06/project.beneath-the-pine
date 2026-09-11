package com.itsumori.beneaththepine.core.task.presentation;

import com.itsumori.beneaththepine.core.task.domain.Task;

import java.util.List;

record TaskListResponse(List<TaskResponse> tasks) {
    static TaskListResponse from(List<Task> tasks) {
        return new TaskListResponse(tasks.stream().map(TaskResponse::from).toList());
    }
}

