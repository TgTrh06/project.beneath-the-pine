package com.itsumori.beneaththepine.core.task.domain;

import java.util.Arrays;

public enum TaskStatus {
    READY("ready"),
    DONE("done"),
    DEFERRED("deferred"),
    ARCHIVED("archived");

    private final String value;

    TaskStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static TaskStatus fromValue(String value) {
        return Arrays.stream(values())
                .filter(status -> status.value.equals(value))
                .findFirst()
                .orElseThrow(() -> new InvalidTaskException("Unsupported task status: " + value));
    }
}

