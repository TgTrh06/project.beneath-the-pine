package com.itsumori.beneaththepine.core.shared.logging;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockFilterChain;

class CorrelationIdFilterTest {

    private final CorrelationIdFilter filter = new CorrelationIdFilter();

    @Test
    void preservesASafeCallerRequestIdAndClearsLoggingContext() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestIds.HEADER, "request-12345678");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getHeader(RequestIds.HEADER)).isEqualTo("request-12345678");
        assertThat(request.getAttribute(RequestIds.ATTRIBUTE)).isEqualTo("request-12345678");
        assertThat(MDC.get("requestId")).isNull();
    }

    @Test
    void replacesAnUnsafeCallerRequestId() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestIds.HEADER, "bad\nvalue");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getHeader(RequestIds.HEADER))
                .isNotBlank()
                .doesNotContain("\n")
                .isNotEqualTo("bad\nvalue");
    }
}
