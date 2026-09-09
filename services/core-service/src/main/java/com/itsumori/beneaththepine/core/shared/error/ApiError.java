package com.itsumori.beneaththepine.core.shared.error;

import java.util.List;

public record ApiError(
        String code,
        String message,
        String requestId,
        List<ApiErrorDetail> details
) {
    public static ApiError of(String code, String message, String requestId) {
        return new ApiError(code, message, requestId, List.of());
    }
}
