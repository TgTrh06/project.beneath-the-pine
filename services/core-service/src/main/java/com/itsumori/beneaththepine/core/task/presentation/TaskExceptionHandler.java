package com.itsumori.beneaththepine.core.task.presentation;

import com.itsumori.beneaththepine.core.shared.error.ApiError;
import com.itsumori.beneaththepine.core.shared.logging.RequestIds;
import com.itsumori.beneaththepine.core.task.domain.ArchivedTaskException;
import com.itsumori.beneaththepine.core.task.domain.InvalidTaskException;
import com.itsumori.beneaththepine.core.task.domain.TaskNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = {NextActionController.class, TaskController.class})
class TaskExceptionHandler {
    @ExceptionHandler(InvalidTaskException.class)
    ResponseEntity<ApiError> handleInvalidTask(
            InvalidTaskException exception,
            HttpServletRequest request
    ) {
        return ResponseEntity.badRequest().body(ApiError.of(
                "INVALID_TASK",
                exception.getMessage(),
                RequestIds.from(request)
        ));
    }

    @ExceptionHandler(TaskNotFoundException.class)
    ResponseEntity<ApiError> handleNotFound(
            TaskNotFoundException exception,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiError.of(
                "TASK_NOT_FOUND",
                exception.getMessage(),
                RequestIds.from(request)
        ));
    }

    @ExceptionHandler(ArchivedTaskException.class)
    ResponseEntity<ApiError> handleArchived(
            ArchivedTaskException exception,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiError.of(
                "TASK_ARCHIVED",
                exception.getMessage(),
                RequestIds.from(request)
        ));
    }
}
