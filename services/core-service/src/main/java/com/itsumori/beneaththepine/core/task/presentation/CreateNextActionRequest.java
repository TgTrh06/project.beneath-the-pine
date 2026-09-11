package com.itsumori.beneaththepine.core.task.presentation;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

record CreateNextActionRequest(
        @NotBlank @Size(min = 2, max = 280) String title,
        @Min(1) @Max(10) int minutes,
        UUID sourceBrainDumpId
) {
}

