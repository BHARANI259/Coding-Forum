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
    private final int uploadMaxAttempts;
    private final long uploadWindowMillis;
    private final int reportMaxAttempts;
    private final long reportWindowMillis;
    private final int mutationMaxAttempts;
    private final long mutationWindowMillis;
    private final int pushMaxAttempts;
    private final long pushWindowMillis;
    private final Map<String, AttemptBucket> attempts = new ConcurrentHashMap<>();

    public ApiRateLimitFilter(
            @Value("${app.security.rate-limit.enabled:true}") boolean enabled,
            @Value("${app.security.rate-limit.login-max-attempts:12}") int loginMaxAttempts,
            @Value("${app.security.rate-limit.login-window-seconds:60}") long loginWindowSeconds,
            @Value("${app.security.rate-limit.password-max-attempts:5}") int passwordMaxAttempts,
            @Value("${app.security.rate-limit.password-window-seconds:300}") long passwordWindowSeconds,
            @Value("${app.security.rate-limit.upload-max-attempts:20}") int uploadMaxAttempts,
            @Value("${app.security.rate-limit.upload-window-seconds:600}") long uploadWindowSeconds,
            @Value("${app.security.rate-limit.report-max-attempts:30}") int reportMaxAttempts,
            @Value("${app.security.rate-limit.report-window-seconds:600}") long reportWindowSeconds,
            @Value("${app.security.rate-limit.mutation-max-attempts:120}") int mutationMaxAttempts,
            @Value("${app.security.rate-limit.mutation-window-seconds:60}") long mutationWindowSeconds,
            @Value("${app.security.rate-limit.push-max-attempts:10}") int pushMaxAttempts,
            @Value("${app.security.rate-limit.push-window-seconds:600}") long pushWindowSeconds
    ) {
        this.enabled = enabled;
        this.loginMaxAttempts = loginMaxAttempts;
        this.loginWindowMillis = loginWindowSeconds * 1000;
        this.passwordMaxAttempts = passwordMaxAttempts;
        this.passwordWindowMillis = passwordWindowSeconds * 1000;
        this.uploadMaxAttempts = uploadMaxAttempts;
        this.uploadWindowMillis = uploadWindowSeconds * 1000;
        this.reportMaxAttempts = reportMaxAttempts;
        this.reportWindowMillis = reportWindowSeconds * 1000;
        this.mutationMaxAttempts = mutationMaxAttempts;
        this.mutationWindowMillis = mutationWindowSeconds * 1000;
        this.pushMaxAttempts = pushMaxAttempts;
        this.pushWindowMillis = pushWindowSeconds * 1000;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!enabled || HttpMethod.OPTIONS.matches(request.getMethod()) || (HttpMethod.GET.matches(request.getMethod()) && !isReportPath(request.getRequestURI()))) {
            filterChain.doFilter(request, response);
            return;
        }

        LimitRule rule = ruleFor(request.getRequestURI());
        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        cleanupExpiredBuckets();
        String key = clientKey(request) + ":" + rule.name();
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
            return new LimitRule("login", loginMaxAttempts, loginWindowMillis);
        }
        if (path.equals("/api/auth/change-password")) {
            return new LimitRule("password", passwordMaxAttempts, passwordWindowMillis);
        }
        if (path.startsWith("/api/push/")) {
            return new LimitRule("push", pushMaxAttempts, pushWindowMillis);
        }
        if (path.contains("/poster") || path.contains("/media") || path.contains("/import")) {
            return new LimitRule("upload", uploadMaxAttempts, uploadWindowMillis);
        }
        if (path.startsWith("/api/admin/reports") || path.startsWith("/api/faculty/reports")) {
            return new LimitRule("report", reportMaxAttempts, reportWindowMillis);
        }
        if (path.startsWith("/api/student/") || path.startsWith("/api/faculty/") || path.startsWith("/api/admin/")) {
            return new LimitRule("mutation", mutationMaxAttempts, mutationWindowMillis);
        }
        return null;
    }

    private boolean isReportPath(String path) {
        return path.startsWith("/api/admin/reports") || path.startsWith("/api/faculty/reports");
    }

    private String clientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
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

    private record LimitRule(String name, int maxAttempts, long windowMillis) {
    }

    private record AttemptBucket(int count, long resetAtMillis) {
    }
}
