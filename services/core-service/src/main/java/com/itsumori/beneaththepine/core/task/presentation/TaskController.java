package com.itsumori.beneaththepine.core.task.presentation;

import com.itsumori.beneaththepine.core.shared.security.AuthenticatedUser;
import com.itsumori.beneaththepine.core.task.application.ArchiveTask;
import com.itsumori.beneaththepine.core.task.application.GetTask;
import com.itsumori.beneaththepine.core.task.application.ListTasks;
import com.itsumori.beneaththepine.core.task.application.UpdateTask;
import com.itsumori.beneaththepine.core.task.domain.Task;
import com.itsumori.beneaththepine.core.task.domain.TaskStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/tasks")
class TaskController {
    private final GetTask getTask;
    private final ListTasks listTasks;
    private final UpdateTask updateTask;
    private final ArchiveTask archiveTask;

    TaskController(GetTask getTask, ListTasks listTasks, UpdateTask updateTask, ArchiveTask archiveTask) {
        this.getTask = getTask;
        this.listTasks = listTasks;
        this.updateTask = updateTask;
        this.archiveTask = archiveTask;
    }

    @GetMapping
    TaskListResponse list(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit
    ) {
        Optional<TaskStatus> statusFilter = Optional.ofNullable(status).map(TaskStatus::fromValue);
        return TaskListResponse.from(listTasks.execute(
                AuthenticatedUser.id(authentication),
                statusFilter,
                limit
        ));
    }

    @GetMapping("/{taskId}")
    TaskResponse get(
            Authentication authentication,
            @PathVariable UUID taskId
    ) {
        return TaskResponse.from(getTask.execute(AuthenticatedUser.id(authentication), taskId));
    }

    @PatchMapping("/{taskId}")
    TaskResponse update(
            Authentication authentication,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
        TaskStatus status = request.status() == null ? null : TaskStatus.fromValue(request.status());
        Task task = updateTask.execute(new UpdateTask.Command(
                AuthenticatedUser.id(authentication),
                taskId,
                request.title(),
                request.minutes(),
                status
        ));
        return TaskResponse.from(task);
    }

    @PostMapping("/{taskId}/archive")
    TaskResponse archive(
            Authentication authentication,
            @PathVariable UUID taskId
    ) {
        return TaskResponse.from(archiveTask.execute(AuthenticatedUser.id(authentication), taskId));
    }
}
