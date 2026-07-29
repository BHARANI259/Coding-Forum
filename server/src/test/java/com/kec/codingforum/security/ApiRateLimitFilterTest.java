package com.kec.codingforum.security;

import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class ApiRateLimitFilterTest {

    @Test
    void throttlesLoginAfterConfiguredAttempts() throws ServletException, IOException {
        ApiRateLimitFilter filter = new ApiRateLimitFilter(true, 2, 60, 5, 300);

        MockHttpServletResponse first = run(filter, "/api/auth/student/login");
        MockHttpServletResponse second = run(filter, "/api/auth/student/login");
        MockHttpServletResponse third = run(filter, "/api/auth/student/login");

        assertThat(first.getStatus()).isEqualTo(200);
        assertThat(second.getStatus()).isEqualTo(200);
        assertThat(third.getStatus()).isEqualTo(429);
        assertThat(third.getHeader("Retry-After")).isNotBlank();
        assertThat(third.getContentAsString()).contains("RATE_LIMITED");
    }

    @Test
    void ignoresUnprotectedPostEndpoints() throws ServletException, IOException {
        ApiRateLimitFilter filter = new ApiRateLimitFilter(true, 1, 60, 1, 300);

        MockHttpServletResponse first = run(filter, "/api/student/events/1/register");
        MockHttpServletResponse second = run(filter, "/api/student/events/1/register");

        assertThat(first.getStatus()).isEqualTo(200);
        assertThat(second.getStatus()).isEqualTo(200);
    }

    private MockHttpServletResponse run(ApiRateLimitFilter filter, String path) throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRemoteAddr("203.0.113.10");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}
