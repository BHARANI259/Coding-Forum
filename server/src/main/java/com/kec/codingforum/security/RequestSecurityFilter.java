package com.kec.codingforum.security;

import com.kec.codingforum.audit.AuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Component
public class RequestSecurityFilter extends OncePerRequestFilter {

    private static final Set<String> ALLOWED_METHODS = Set.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
    private static final List<String> DANGEROUS_PATH_MARKERS = List.of(
            "../", "..\\", "%2e%2e", "%252e%252e", "%5c", "%255c", "%00", "\u0000"
    );

    private final AuditService auditService;
    private final int maxQueryLength;
    private final int maxUserAgentLength;
    private final boolean blockSuspiciousRequests;

    public RequestSecurityFilter(
            AuditService auditService,
            @Value("${app.security.request.max-query-length:2048}") int maxQueryLength,
            @Value("${app.security.request.max-user-agent-length:500}") int maxUserAgentLength,
            @Value("${app.security.request.block-suspicious:true}") boolean blockSuspiciousRequests
    ) {
        this.auditService = auditService;
        this.maxQueryLength = maxQueryLength;
        this.maxUserAgentLength = maxUserAgentLength;
        this.blockSuspiciousRequests = blockSuspiciousRequests;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Rejection rejection = validateRequest(request);
        if (rejection != null && blockSuspiciousRequests) {
            auditService.record("SUSPICIOUS_REQUEST_BLOCKED", "REQUEST", request.getRequestURI(), AuditService.DENIED, rejection.message());
            response.setStatus(rejection.status());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Request rejected by security policy.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private Rejection validateRequest(HttpServletRequest request) {
        String method = request.getMethod();
        if (!ALLOWED_METHODS.contains(method)) {
            return new Rejection(HttpServletResponse.SC_METHOD_NOT_ALLOWED, "Unsupported HTTP method.");
        }

        String uri = normalize(request.getRequestURI());
        for (String marker : DANGEROUS_PATH_MARKERS) {
            if (uri.contains(marker)) {
                return new Rejection(HttpServletResponse.SC_BAD_REQUEST, "Path traversal or encoded separator marker.");
            }
        }

        String query = request.getQueryString();
        if (query != null) {
            String normalizedQuery = normalize(query);
            if (query.length() > maxQueryLength) {
                return new Rejection(HttpServletResponse.SC_REQUEST_URI_TOO_LONG, "Query string too long.");
            }
            if (normalizedQuery.contains("%00") || normalizedQuery.contains("\u0000")
                    || normalizedQuery.contains("%0d") || normalizedQuery.contains("%0a")) {
                return new Rejection(HttpServletResponse.SC_BAD_REQUEST, "Suspicious query encoding.");
            }
        }

        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && userAgent.length() > maxUserAgentLength) {
            return new Rejection(HttpServletResponse.SC_BAD_REQUEST, "User-Agent too long.");
        }

        String contentType = request.getContentType();
        if (requiresKnownContentType(method) && !hasAcceptedContentType(contentType)) {
            return new Rejection(HttpServletResponse.SC_UNSUPPORTED_MEDIA_TYPE, "Unsupported content type.");
        }

        return null;
    }

    private boolean requiresKnownContentType(String method) {
        return "POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method);
    }

    private boolean hasAcceptedContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return false;
        }
        String normalized = contentType.toLowerCase(Locale.ROOT);
        return normalized.startsWith(MediaType.APPLICATION_JSON_VALUE)
                || normalized.startsWith(MediaType.MULTIPART_FORM_DATA_VALUE)
                || normalized.startsWith(MediaType.APPLICATION_FORM_URLENCODED_VALUE);
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private record Rejection(int status, String message) {
    }
}
