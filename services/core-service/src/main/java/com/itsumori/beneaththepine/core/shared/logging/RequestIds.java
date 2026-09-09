package com.itsumori.beneaththepine.core.shared.logging;

import jakarta.servlet.http.HttpServletRequest;

public final class RequestIds {
    public static final String HEADER = "X-Request-ID";
    public static final String ATTRIBUTE = RequestIds.class.getName() + ".value";

    private RequestIds() {
    }

    public static String from(HttpServletRequest request) {
        Object value = request.getAttribute(ATTRIBUTE);
        return value instanceof String requestId ? requestId : "unavailable";
    }
}
