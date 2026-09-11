package com.itsumori.beneaththepine.core.shared.error;

import com.itsumori.beneaththepine.core.shared.logging.RequestIds;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApplicationException.class)
    ResponseEntity<ApiError> handleApplicationException(
            ApplicationException exception,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(exception.status()).body(ApiError.of(
                exception.code(),
                exception.getMessage(),
                RequestIds.from(request)
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        List<ApiErrorDetail> details = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new ApiErrorDetail(error.getField(), "INVALID"))
                .distinct()
                .toList();
        ApiError body = new ApiError(
                "VALIDATION_FAILED",
                "The request could not be processed.",
                RequestIds.from(request),
                details
        );
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> handleMalformedJson(
            HttpMessageNotReadableException exception,
            HttpServletRequest request
    ) {
        return ResponseEntity.badRequest().body(ApiError.of(
                "MALFORMED_JSON",
                "The request body is not valid JSON.",
                RequestIds.from(request)
        ));
    }

    @ExceptionHandler({
            ConstraintViolationException.class,
            HandlerMethodValidationException.class,
            MethodArgumentTypeMismatchException.class
    })
    ResponseEntity<ApiError> handleInvalidRequestParameter(
            Exception exception,
            HttpServletRequest request
    ) {
        return ResponseEntity.badRequest().body(ApiError.of(
                "VALIDATION_FAILED",
                "The request could not be processed.",
                RequestIds.from(request)
        ));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleUnexpected(Exception exception, HttpServletRequest request) {
        String requestId = RequestIds.from(request);
        LOGGER.error("Unhandled request failure requestId={}", requestId, exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiError.of(
                "INTERNAL_ERROR",
                "The request could not be completed.",
                requestId
        ));
    }
}
