package com.itsumori.beneaththepine.core.task.domain;

public final class InvalidTaskException extends RuntimeException {
    public InvalidTaskException(String message) {
        super(message);
    }
}

