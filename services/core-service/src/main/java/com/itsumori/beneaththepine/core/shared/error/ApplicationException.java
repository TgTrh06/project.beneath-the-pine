package com.itsumori.beneaththepine.core.shared.error;

import org.springframework.http.HttpStatus;

public class ApplicationException extends RuntimeException {
    private final String code;
    private final HttpStatus status;

    public ApplicationException(String code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public String code() {
        return code;
    }

    public HttpStatus status() {
        return status;
    }
}
