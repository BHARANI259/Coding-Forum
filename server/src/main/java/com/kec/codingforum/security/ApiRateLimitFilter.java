package com.kec.codingforum.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ApiRateLimitFilter extends OncePerRequestFilter {

    private final boolean enabled;
    private final int loginMaxAttempts;
    private final long loginWindowMillis;
    private final int passwordMaxAttempts;
    private final long passwordWindowMillis;
    private final Map<String, AttemptBucket> attempts = new ConcurrentHashMap<>();

    public ApiRateLimitFilter(
            @Value("${app.security.rate-limit.enabled:true}") boolean enabled,
            @Value("${app.security.rate-limit.login-max-attempts:12}") int loginMaxAttempts,
            @Value("${app.security.rate-limit.login-window-seconds:60}") long loginWindowSeconds,
            @Value("${app.security.rate-limit.password-max-attempts:5}") int passwordMaxAttempts,
            @Value("${app.security.rate-limit.password-window-seconds:300}") long passwordWindowSeconds
    ) {
        this.enabled = enabled;
        this.loginMaxAttempts = loginMaxAttempts;
        this.loginWindowMillis = loginWindowSeconds * 1000;
        this.passwordMaxAttempts = passwordMaxAttempts;
        this.passwordWindowMillis = passwordWindowSeconds * 1000;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!enabled || !HttpMethod.POST.matches(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        LimitRule rule = ruleFor(request.getRequestURI());
        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        cleanupExpiredBuckets();
        String key = request.getRemoteAddr() + ":" + request.getRequestURI();
        AttemptBucket bucket = attempts.compute(key, (ignored, current) -> {
            long now = Instant.now().toEpochMilli();
            if (current == null || now >= current.resetAtMillis()) {
                return new AttemptBucket(1, now + rule.windowMillis());
            }
            return new AttemptBucket(current.count() + 1, current.resetAtMillis());
        });

        if (bucket.count() > rule.maxAttempts()) {
            long retryAfterSeconds = Math.max(1, (bucket.resetAtMillis() - Instant.now().toEpochMilli()) / 1000);
            response.setStatus(429);
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.getWriter().write("{\"code\":\"RATE_LIMITED\",\"message\":\"Too many attempts. Please wait before trying again.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private LimitRule ruleFor(String path) {
        if (path.equals("/api/auth/student/login") || path.equals("/api/auth/faculty/login") || path.equals("/api/auth/admin/login")) {
            return new LimitRule(loginMaxAttempts, loginWindowMillis);
        }
        if (path.equals("/api/auth/change-password")) {
            return new LimitRule(passwordMaxAttempts, passwordWindowMillis);
        }
        return null;
    }

    private void cleanupExpiredBuckets() {
        long now = Instant.now().toEpochMilli();
        Iterator<Map.Entry<String, AttemptBucket>> iterator = attempts.entrySet().iterator();
        while (iterator.hasNext()) {
            if (now >= iterator.next().getValue().resetAtMillis()) {
                iterator.remove();
            }
        }
    }

    private record LimitRule(int maxAttempts, long windowMillis) {
    }

    private record AttemptBucket(int count, long resetAtMillis) {
    }
}
