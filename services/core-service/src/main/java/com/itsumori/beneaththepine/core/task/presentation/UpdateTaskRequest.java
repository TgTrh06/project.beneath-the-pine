package com.itsumori.beneaththepine.core.task.presentation;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

record UpdateTaskRequest(
        @Size(min = 2, max = 280) String title,
        @Min(1) @Max(10) Integer minutes,
        @Pattern(regexp = "ready|done|deferred") String status
) {
    @AssertTrue(message = "At least one task field must be provided")
    public boolean isUpdateRequested() {
        return title != null || minutes != null || status != null;
    }
}
