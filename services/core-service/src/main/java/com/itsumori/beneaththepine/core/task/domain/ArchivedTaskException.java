package com.itsumori.beneaththepine.core.task.domain;

public final class ArchivedTaskException extends RuntimeException {
    public ArchivedTaskException() {
        super("Archived tasks cannot be changed");
    }
}

